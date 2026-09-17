"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  overdueWhatsAppProgressSchema,
  sendOverdueInvoicesWhatsAppSchema,
} from "../schemas/send-overdue-invoices-whatsapp.schema";

import {
  getOverdueWhatsAppProgressService,
  sendOverdueInvoicesWhatsAppService,
} from "../services/invoice-whatsapp.service";

// ============================================================================
// Send Selected Overdue Invoice
// ============================================================================

export async function sendOverdueInvoicesWhatsAppAction(
  input: unknown,
) {
  const parsed =
    sendOverdueInvoicesWhatsAppSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success:
        false as const,

      message:
        parsed.error
          .issues[0]
          ?.message ??
        "Invoice tidak valid.",
    };
  }

  try {
    const result =
      await sendOverdueInvoicesWhatsAppService(
        parsed.data,
      );

    revalidatePath(
      "/billing",
    );

    return {
      success:
        true as const,

      data:
        result,
    };
  } catch (
    error
  ) {
    return {
      success:
        false as const,

      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat antrean WhatsApp.",
    };
  }
}

// ============================================================================
// Realtime WhatsApp Progress
// ============================================================================

export async function getOverdueWhatsAppProgressAction(
  input: unknown,
) {
  const parsed =
    overdueWhatsAppProgressSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success:
        false as const,

      message:
        "ID pesan WhatsApp tidak valid.",
    };
  }

  try {
    const data =
      await getOverdueWhatsAppProgressService(
        parsed.data.messageIds,
      );

    return {
      success:
        true as const,

      data,
    };
  } catch (
    error
  ) {
    return {
      success:
        false as const,

      message:
        error instanceof Error
          ? error.message
          : "Gagal membaca progress WhatsApp.",
    };
  }
}