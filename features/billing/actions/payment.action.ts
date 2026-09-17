"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createPaymentSchema,
  customerPaymentInvoicesSchema,
  editPaymentSchema,
  paymentHistorySchema,
  deletePaymentSchema
} from "../schemas/payment.schema";

import {
  createPaymentService,
  editPaymentService,
  listCustomerOutstandingInvoicesService,
  listCustomerPaymentHistoryService,
  deletePaymentService
} from "../services/payment.service";

// ============================================================================
// Result
// ============================================================================
export type CreatePaymentActionResult =
  | {
      success: true;
      message: string;
      data: {
        paymentNumber: string;
        paidAmount: number;
        remainingAmount: number;
        status:
          | "PARTIAL"
          | "PAID";
      };
    }
  | {
      success: false;
      message: string;
    };

// ============================================================================
// Action
// ============================================================================

export async function createPaymentAction(
  input: unknown,
): Promise<CreatePaymentActionResult> {
  const parsed =
    createPaymentSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]
          ?.message ??
        "Data pembayaran tidak valid.",
    };
  }

  try {
    const result =
      await createPaymentService(
        parsed.data,
      );

    revalidatePath(
      "/billing",
    );

    return {
      success: true,
      message:
        "Pembayaran berhasil disimpan.",
      data: {
        paymentNumber:
          result.payment
            .paymentNumber,
        paidAmount:
          result.paidAmount,
        remainingAmount:
          result.remainingAmount,
        status:
          result.invoiceStatus as
            | "PARTIAL"
            | "PAID",
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan pembayaran.",
    };
  }
}

// ============================================================================
// Customer Outstanding Invoices
// ============================================================================

export async function getCustomerOutstandingInvoicesAction(
  input: unknown,
) {
  const parsed =
    customerPaymentInvoicesSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        "Parameter invoice customer tidak valid.",
      data: [],
    };
  }

  try {
    const data =
      await listCustomerOutstandingInvoicesService(
        parsed.data.customerId,
        parsed.data.period,
      );

    return {
      success: true as const,
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengambil invoice customer.",
      data: [],
    };
  }
}

// ============================================================================
// Payment History
// ============================================================================

export async function getCustomerPaymentHistoryAction(
  input: unknown,
) {
  const parsed =
    paymentHistorySchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        "Parameter riwayat pembayaran tidak valid.",
      data: null,
    };
  }

  try {
    const data =
      await listCustomerPaymentHistoryService(
        parsed.data.customerId,
        parsed.data.period,
      );

    return {
      success: true as const,
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengambil riwayat pembayaran.",
      data: null,
    };
  }
}

// ============================================================================
// Edit Payment
// ============================================================================

export async function editPaymentAction(
  input: unknown,
) {
  const parsed =
    editPaymentSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        parsed.error.issues[0]
          ?.message ??
        "Data pembayaran tidak valid.",
    };
  }

  try {
    const result =
      await editPaymentService(
        parsed.data,
      );

    revalidatePath(
      "/billing",
    );

    revalidatePath(
      "/billing/payments",
    );

    return {
      success: true as const,
      message:
        "Pembayaran berhasil diperbarui.",
      data: {
        paidAmount:
          result.paidAmount,
        remainingAmount:
          result.remainingAmount,
        status:
          result.invoiceStatus,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui pembayaran.",
    };
  }
}


// ============================================================================
// Delete Payment
// ============================================================================

export async function deletePaymentAction(
  input: unknown,
) {
  const parsed =
    deletePaymentSchema.safeParse(
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
        "Data pembayaran tidak valid.",
    };
  }

  try {
    const result =
      await deletePaymentService(
        parsed.data,
      );

    revalidatePath(
      "/billing",
    );

    revalidatePath(
      "/billing/payments",
    );

    return {
      success:
        true as const,

      message:
        "Pembayaran berhasil dihapus.",

      data: {
        invoiceId:
          result.invoiceId,
        invoiceStatus:
          result.invoiceStatus,
        paidAmount:
          result.paidAmount,
        remainingAmount:
          result.remainingAmount,
      },
    };
  } catch (error) {
    return {
      success:
        false as const,

      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus pembayaran.",
    };
  }
}