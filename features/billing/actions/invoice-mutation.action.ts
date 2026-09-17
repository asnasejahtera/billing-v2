"use server";

import { revalidatePath } from "next/cache";

import {
  deleteInvoiceSchema,
  editInvoiceSchema,
} from "../schemas/invoice-mutation.schema";
import {
  deleteInvoiceService,
  editInvoiceService,
} from "../services/invoice-mutation.service";

// ============================================================================
// Result
// ============================================================================

export type InvoiceMutationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

// ============================================================================
// Edit
// ============================================================================

export async function editInvoiceAction(
  input: unknown,
): Promise<InvoiceMutationResult> {
  const parsed =
    editInvoiceSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]
          ?.message ??
        "Data invoice tidak valid.",
    };
  }

  try {
    await editInvoiceService(
      parsed.data,
    );

    revalidatePath(
      "/billing",
    );

    return {
      success: true,
      message:
        "Invoice berhasil diperbarui.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui invoice.",
    };
  }
}

// ============================================================================
// Delete
// ============================================================================

export async function deleteInvoiceAction(
  input: unknown,
): Promise<InvoiceMutationResult> {
  const parsed =
    deleteInvoiceSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]
          ?.message ??
        "Data penghapusan tidak valid.",
    };
  }

  try {
    await deleteInvoiceService(
      parsed.data,
    );

    revalidatePath(
      "/billing",
    );

    return {
      success: true,
      message:
        "Invoice berhasil dihapus.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus invoice.",
    };
  }
}