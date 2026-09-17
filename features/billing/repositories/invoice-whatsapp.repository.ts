import {
  and,
  eq,
  inArray,
  lt,
  ne,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";
import { invoices } from "@/db/schema/invoices";
import { payments } from "@/db/schema/payments";
import {
  whatsappMessages,
} from "@/db/schema/whatsapp-messages";

// ============================================================================
// Selected Overdue Invoices
// ============================================================================

export async function listSelectedOverdueInvoices(
  invoiceIds: number[],
  today: string,
) {
  // --------------------------------------------------------------------------
  // Payment SUCCESS
  // --------------------------------------------------------------------------

  const paymentTotals =
    db
      .select({
        invoiceId:
          payments.invoiceId,

        paidAmount:
          sql<string>`
            COALESCE(
              SUM(${payments.amount}),
              0
            )
          `.as("paid_amount"),
      })
      .from(payments)
      .where(
        eq(
          payments.status,
          "SUCCESS",
        ),
      )
      .groupBy(
        payments.invoiceId,
      )
      .as(
        "payment_totals",
      );

  // --------------------------------------------------------------------------
  // Invoice + Customer
  // --------------------------------------------------------------------------

  const rows =
    await db
      .select({
        id:
          invoices.id,

        invoiceNumber:
          invoices.invoiceNumber,

        dueDate:
          invoices.dueDate,

        total:
          invoices.total,

        customerId:
          customers.id,

        customerName:
          customers.name,

        phone:
          customers.phone,

        paidAmount:
          sql<string>`
            COALESCE(
              ${paymentTotals.paidAmount},
              0
            )
          `,

        remainingAmount:
          sql<string>`
            GREATEST(
              ${invoices.total} -
              COALESCE(
                ${paymentTotals.paidAmount},
                0
              ),
              0
            )
          `,
      })
      .from(invoices)
      .innerJoin(
        customers,
        eq(
          customers.id,
          invoices.customerId,
        ),
      )
      .leftJoin(
        paymentTotals,
        eq(
          paymentTotals.invoiceId,
          invoices.id,
        ),
      )
      .where(
        and(
          inArray(
            invoices.id,
            invoiceIds,
          ),

          ne(
            invoices.status,
            "VOID",
          ),

          lt(
            invoices.dueDate,
            today,
          ),
        ),
      );

  // Backend tetap memastikan ada sisa tagihan.
  return rows.filter(
    (invoice) =>
      Number(
        invoice.remainingAmount,
      ) > 0,
  );
}

// ============================================================================
// Queue Existing
// Hanya PENDING / PROCESSING yang dianggap duplicate aktif.
// ============================================================================

export async function listActiveOverdueQueue(
  phones: string[],
) {
  if (
    phones.length === 0
  ) {
    return [];
  }

  return db
    .select({
      recipientPhone:
        whatsappMessages.recipientPhone,
      body:
        whatsappMessages.body,
    })
    .from(
      whatsappMessages,
    )
    .where(
      and(
        eq(
          whatsappMessages.source,
          "OVERDUE",
        ),

        inArray(
          whatsappMessages.status,
          [
            "PENDING",
            "PROCESSING",
          ],
        ),

        inArray(
          whatsappMessages.recipientPhone,
          phones,
        ),
      ),
    );
}

// ============================================================================
// Insert Queue
// ============================================================================

export async function insertOverdueInvoiceMessages(
  values: {
    recipientPhone: string;
    recipientName: string;
    body: string;
    availableAt: Date;
  }[],
) {
  if (
    values.length === 0
  ) {
    return [];
  }

  return db
    .insert(
      whatsappMessages,
    )
    .values(
      values.map(
        (value) => ({
          clientKey:
            "default",

          source:
            "OVERDUE" as const,

          status:
            "PENDING" as const,

          recipientPhone:
            value.recipientPhone,

          recipientName:
            value.recipientName,

          body:
            value.body,

          availableAt:
            value.availableAt,
        }),
      ),
    )
    .returning({
      id:
        whatsappMessages.id,
      status:
        whatsappMessages.status,
    });
}

// ============================================================================
// Realtime Queue Status
// ============================================================================

export async function getOverdueMessageStatuses(
  messageIds: number[],
) {
  if (messageIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: whatsappMessages.id,
      status: whatsappMessages.status,
      recipientName: whatsappMessages.recipientName,
      recipientPhone: whatsappMessages.recipientPhone,
      error: whatsappMessages.error,
      availableAt: whatsappMessages.availableAt,
      processingAt: whatsappMessages.processingAt,
      sentAt: whatsappMessages.sentAt,
      failedAt: whatsappMessages.failedAt,
    })
    .from(whatsappMessages)
    .where(
      and(
        eq(
          whatsappMessages.source,
          "OVERDUE",
        ),
        inArray(
          whatsappMessages.id,
          messageIds,
        ),
      ),
    )
    .orderBy(
      asc(
        whatsappMessages.id,
      ),
    );
}