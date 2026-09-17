import {
  getOverdueMessageStatuses,
  insertOverdueInvoiceMessages,
  listActiveOverdueQueue,
  listSelectedOverdueInvoices,
} from "../repositories/invoice-whatsapp.repository";

import type {
  SendOverdueInvoicesWhatsAppInput,
} from "../schemas/send-overdue-invoices-whatsapp.schema";

import {
  invoiceWhatsAppTemplates,
} from "../constants/invoice-whatsapp-templates";

// ============================================================================
// Jakarta Date
// ============================================================================

function getJakartaDate() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Jakarta",
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      },
    ).formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (item) =>
        item.type === "year",
    )?.value;

  const month =
    parts.find(
      (item) =>
        item.type === "month",
    )?.value;

  const day =
    parts.find(
      (item) =>
        item.type === "day",
    )?.value;

  return `${year}-${month}-${day}`;
}

// ============================================================================
// Phone
// ============================================================================

function normalizePhone(
  value:
    | string
    | null,
) {
  if (!value) {
    return null;
  }

  let phone =
    value.replace(
      /\D/g,
      "",
    );

  if (
    phone.startsWith("0")
  ) {
    phone =
      `62${phone.slice(1)}`;
  } else if (
    phone.startsWith("8")
  ) {
    phone =
      `62${phone}`;
  }

  if (
    !phone.startsWith("62")
  ) {
    return null;
  }

  if (
    phone.length < 10 ||
    phone.length > 15
  ) {
    return null;
  }

  return phone;
}

// ============================================================================
// Format
// ============================================================================

function formatCurrency(
  value: string,
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",
      currency:
        "IDR",
      maximumFractionDigits:
        0,
    },
  ).format(
    Number(value),
  );
}

function formatDate(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(
      year,
      month - 1,
      day,
    ),
  );
}

// ============================================================================
// Message
// ============================================================================

function createMessage(
  invoice: {
    customerName: string;
    invoiceNumber: string;
    dueDate: string;
    remainingAmount: string;
  },
) {
  return [
    `Yth. Bapak/Ibu ${invoice.customerName},`,
    "",
    `Kami menginformasikan bahwa tagihan ${invoice.invoiceNumber} telah melewati tanggal jatuh tempo.`,
    "",
    `Jatuh tempo: ${formatDate(invoice.dueDate)}`,
    `Sisa tagihan: ${formatCurrency(invoice.remainingAmount)}`,
    "",
    "Mohon segera melakukan pembayaran.",
    "",
    "Terima kasih.",
  ].join("\n");
}

// ============================================================================
// Queue Selected Invoice
// ============================================================================

export async function sendOverdueInvoicesWhatsAppService(
  input: SendOverdueInvoicesWhatsAppInput,
) {
// ============================================================================
// Message Template
// ============================================================================

const messageTemplate = resolveMessageTemplate(input);

  const invoices =
    await listSelectedOverdueInvoices(
      input.invoiceIds,
      getJakartaDate(),
    );

  const valid = invoices
    .map(
      (invoice) => ({
        ...invoice,

        phone:
          normalizePhone(
            invoice.phone,
          ),

        body:
            renderInvoiceMessage(
                messageTemplate,
                invoice,
            ),

      }),
    )
    .filter(
      (
        invoice,
      ): invoice is typeof invoice & {
        phone: string;
      } =>
        invoice.phone !==
        null,
    );

  // --------------------------------------------------------------------------
  // Hindari double click / duplicate aktif.
  // Dibandingkan berdasarkan phone + isi pesan.
  // --------------------------------------------------------------------------

  const existing =
    await listActiveOverdueQueue(
      [
        ...new Set(
          valid.map(
            (item) =>
              item.phone,
          ),
        ),
      ],
    );

  const busyKeys =
    new Set(
      existing.map(
        (item) =>
          `${item.recipientPhone}|${item.body}`,
      ),
    );

  const ready =
    valid.filter(
      (item) =>
        !busyKeys.has(
          `${item.phone}|${item.body}`,
        ),
    );

  // --------------------------------------------------------------------------
  // Delay 5 detik antar pesan
  // --------------------------------------------------------------------------

  const now =
    Date.now();

  const queued =
    await insertOverdueInvoiceMessages(
        ready.map(
        (
            invoice,
            index,
        ) => ({
            recipientPhone:
            invoice.phone,

            recipientName:
            invoice.customerName,

            body:
            invoice.body,

            availableAt:
            new Date(
                now +
                index *
                    5_000,
            ),
        }),
        ),
    );

  return {
    selected:
      input.invoiceIds.length,

    queued:
      queued.length,

    // ==========================================================================
    // ID dipakai frontend untuk realtime progress
    // ==========================================================================

    messageIds:
      queued.map(
        (message) =>
          message.id,
      ),

    skippedNotOverdue:
      input.invoiceIds.length -
      invoices.length,

    skippedInvalidPhone:
      invoices.length -
      valid.length,

    skippedDuplicate:
      valid.length -
      ready.length,
  };
}

// ============================================================================
// Message Template Renderer
// ============================================================================

function renderInvoiceMessage(
  template: string,
  invoice: {
    customerName: string;
    invoiceNumber: string;
    dueDate: string;
    remainingAmount: string;
  },
) {
  return template
    .replaceAll(
      "{{nama}}",
      invoice.customerName,
    )
    .replaceAll(
      "{{invoice}}",
      invoice.invoiceNumber,
    )
    .replaceAll(
      "{{jatuh_tempo}}",
      formatDate(
        invoice.dueDate,
      ),
    )
    .replaceAll(
      "{{sisa_tagihan}}",
      formatCurrency(
        invoice.remainingAmount,
      ),
    );
}

// ============================================================================
// Resolve Message
// ============================================================================

function resolveMessageTemplate(
  input: SendOverdueInvoicesWhatsAppInput,
) {
  if (
    input.messageMode ===
    "MANUAL"
  ) {
    return (
      input.manualMessage?.trim() ??
      ""
    );
  }

  const template =
    invoiceWhatsAppTemplates.find(
      (item) =>
        item.id ===
        input.templateId,
    );

  if (!template) {
    throw new Error(
      "Template WhatsApp tidak ditemukan.",
    );
  }

  return template.body;
}

// ============================================================================
// Random Delay
// ============================================================================

function randomInteger(
  min: number,
  max: number,
) {
  return Math.floor(
    Math.random() *
      (max - min + 1),
  ) + min;
}

// ============================================================================
// Realtime WhatsApp Progress
// ============================================================================

export async function getOverdueWhatsAppProgressService(
  messageIds: number[],
) {
  const messages =
    await getOverdueMessageStatuses(
      messageIds,
    );

  const pending =
    messages.filter(
      (message) =>
        message.status ===
        "PENDING",
    ).length;

  const processing =
    messages.filter(
      (message) =>
        message.status ===
        "PROCESSING",
    ).length;

  const sent =
    messages.filter(
      (message) =>
        message.status ===
        "SENT",
    ).length;

  const failed =
    messages.filter(
      (message) =>
        message.status ===
        "FAILED",
    ).length;

  const cancelled =
    messages.filter(
      (message) =>
        message.status ===
        "CANCELLED",
    ).length;

  const total =
    messages.length;

  const finished =
    sent +
    failed +
    cancelled;

  const percent =
    total > 0
      ? Math.round(
          (
            finished /
            total
          ) * 100,
        )
      : 0;

  const done =
    total > 0 &&
    pending === 0 &&
    processing === 0;

  return {
    total,
    pending,
    processing,
    sent,
    failed,
    cancelled,
    finished,
    percent,
    done,

    messages,
  };
}
