"use server";

import { revalidatePath } from "next/cache";

import {
  createManualInvoiceSchema,
} from "../schemas/manual-invoice.schema";
import {
  createManualInvoiceService,
} from "../services/manual-invoice.service";
import {
  overdueWhatsAppProgressSchema,
  sendOverdueInvoicesWhatsAppSchema,
} from "../schemas/send-overdue-invoices-whatsapp.schema";

import {
  getOverdueWhatsAppProgressService,
  sendOverdueInvoicesWhatsAppService,
} from "../services/invoice-whatsapp.service";

// ============================================================================
// Result
// ============================================================================

export type CreateManualInvoiceActionResult =
  | {
      success: true;
      message: string;
      data: {
        id: number;
        invoiceNumber: string;
      };
    }
  | {
      success: false;
      message: string;
    };

// ============================================================================
// Create
// ============================================================================

export async function createManualInvoiceAction(
  input: unknown,
): Promise<CreateManualInvoiceActionResult> {
  const parsed =
    createManualInvoiceSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ??
        "Data invoice tidak valid.",
    };
  }

  try {
    const invoice =
      await createManualInvoiceService(
        parsed.data,
      );

    revalidatePath("/billing");

    return {
      success: true,
      message:
        "Invoice manual berhasil dibuat.",
      data: {
        id: invoice.id,
        invoiceNumber:
          invoice.invoiceNumber,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat invoice manual.",
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