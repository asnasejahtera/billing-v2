"use server";

import { revalidatePath } from "next/cache";

import {
  generateInvoicesSchema,
} from "../schemas/generate-invoices.schema";

import {
  generateMonthlyInvoicesService,
} from "../services/generate-invoices.service";

// ============================================================================
// Action Result
// ============================================================================

export type GenerateInvoicesActionResult =
  | {
      success: true;
      message: string;
      data: {
        totalActive: number;
        created: number;
        skipped: number;
        invoiceDate: string;
        dueDate: string;
      };
    }
  | {
      success: false;
      message: string;
    };

// ============================================================================
// Generate Invoice Action
// ============================================================================

export async function generateInvoicesAction(
  input: unknown,
): Promise<GenerateInvoicesActionResult> {
  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  const parsed =
    generateInvoicesSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]
          ?.message ??
        "Data generate invoice tidak valid.",
    };
  }

  // --------------------------------------------------------------------------
  // Generate
  // --------------------------------------------------------------------------

  try {
    const result =
      await generateMonthlyInvoicesService(
        parsed.data,
      );

    revalidatePath("/billing");

    return {
      success: true,
      message:
        `${result.created} invoice berhasil dibuat, ${result.skipped} dilewati.`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal generate invoice.",
    };
  }
}