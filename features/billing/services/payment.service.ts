import { randomUUID } from "node:crypto";

import {
  findInvoiceForPayment,
  findPaymentForEdit,
  getInvoicePaidAmount,
  getOtherSuccessfulPaymentAmount,
  insertPayment,
  listCustomerOutstandingInvoices,
  listCustomerPaymentHistory,
  updateInvoicePaymentStatus,
  updatePaymentById,
} from "../repositories/payment.repository";
import type {
  CreatePaymentInput,
  EditPaymentInput,
} from "../schemas/payment.schema";


// ============================================================================
// Payment Number
// ============================================================================

function createPaymentNumber(
  paymentDate: string,
) {
  const date =
    paymentDate.replaceAll(
      "-",
      "",
    );

  const suffix =
    randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase();

  return `PAY-${date}-${suffix}`;
}

// ============================================================================
// Create Payment
// ============================================================================

export async function createPaymentService(
  input: CreatePaymentInput,
) {
  // --------------------------------------------------------------------------
  // Invoice
  // --------------------------------------------------------------------------

  const invoice =
    await findInvoiceForPayment(
      input.invoiceId,
    );

  if (!invoice) {
    throw new Error(
      "Invoice tidak ditemukan.",
    );
  }

  if (
    invoice.status === "VOID"
  ) {
    throw new Error(
      "Invoice yang dibatalkan tidak dapat dibayar.",
    );
  }

  if (
    invoice.status === "PAID"
  ) {
    throw new Error(
      "Invoice sudah lunas.",
    );
  }

  // --------------------------------------------------------------------------
  // Current Payment
  // --------------------------------------------------------------------------

  const currentPaid =
    Number(
      await getInvoicePaidAmount(
        invoice.id,
      ),
    );

  const total =
    Number(
      invoice.total,
    );

  const remaining =
    total -
    currentPaid;

  if (
    remaining <= 0
  ) {
    throw new Error(
      "Invoice sudah lunas.",
    );
  }

  if (
    input.amount >
    remaining
  ) {
    throw new Error(
      `Pembayaran melebihi sisa tagihan Rp${remaining.toLocaleString("id-ID")}.`,
    );
  }

  // --------------------------------------------------------------------------
  // Insert Payment
  // --------------------------------------------------------------------------

  const payment =
    await insertPayment({
      paymentNumber:
        createPaymentNumber(
          input.paymentDate,
        ),

      invoiceId:
        invoice.id,

      paymentDate:
        input.paymentDate,

      amount:
        input.amount.toFixed(2),

      method:
        input.method,

      referenceNumber:
        input.referenceNumber ||
        null,

      notes:
        input.notes ||
        null,

      status:
        "SUCCESS",
    });

  if (!payment) {
    throw new Error(
      "Pembayaran gagal disimpan.",
    );
  }

  // --------------------------------------------------------------------------
  // Recalculate
  // --------------------------------------------------------------------------

  const paidAmount =
    Number(
      await getInvoicePaidAmount(
        invoice.id,
      ),
    );

  const remainingAmount =
    Math.max(
      total -
        paidAmount,
      0,
    );

  const status =
    remainingAmount <= 0
      ? "PAID"
      : "PARTIAL";

  const updated =
    await updateInvoicePaymentStatus(
      invoice.id,
      status,
    );

  if (!updated) {
    throw new Error(
      "Pembayaran tersimpan tetapi status invoice gagal diperbarui.",
    );
  }

  return {
    payment,
    invoiceStatus:
      status,
    total,
    paidAmount,
    remainingAmount,
  };
}

// ============================================================================
// Customer Outstanding Invoices
// ============================================================================

export async function listCustomerOutstandingInvoicesService(
  customerId: number,
  period?: string,
) {
  return listCustomerOutstandingInvoices(
    customerId,
    period,
  );
}

// ============================================================================
// Payment History
// ============================================================================

export async function listCustomerPaymentHistoryService(
  customerId: number,
  period?: string,
) {
  const payments =
    await listCustomerPaymentHistory(
      customerId,
      period,
    );

  // --------------------------------------------------------------------------
  // Summary hanya menghitung payment SUCCESS
  // --------------------------------------------------------------------------

  const totalSuccess =
    payments.reduce(
      (total, payment) =>
        payment.status === "SUCCESS"
          ? total + Number(payment.amount)
          : total,
      0,
    );

  const successCount =
    payments.filter(
      (payment) =>
        payment.status === "SUCCESS",
    ).length;

  return {
    payments,
    totalSuccess,
    successCount,
    totalRecords:
      payments.length,
  };
}

// ============================================================================
// Edit Payment
// ============================================================================

export async function editPaymentService(
  input: EditPaymentInput,
) {
  // --------------------------------------------------------------------------
  // Payment + Invoice
  // --------------------------------------------------------------------------

  const payment =
    await findPaymentForEdit(
      input.id,
    );

  if (!payment) {
    throw new Error(
      "Pembayaran tidak ditemukan.",
    );
  }

  if (
    payment.status !==
    "SUCCESS"
  ) {
    throw new Error(
      "Pembayaran yang sudah dibatalkan tidak dapat diedit.",
    );
  }

  if (
    payment.invoiceStatus ===
    "VOID"
  ) {
    throw new Error(
      "Invoice sudah dibatalkan.",
    );
  }

  // --------------------------------------------------------------------------
  // Hitung pembayaran lain pada invoice
  // --------------------------------------------------------------------------

  const otherPaid =
    Number(
      await getOtherSuccessfulPaymentAmount(
        payment.invoiceId,
        payment.id,
      ),
    );

  const invoiceTotal =
    Number(
      payment.invoiceTotal,
    );

  const maximumAmount =
    invoiceTotal -
    otherPaid;

  if (
    input.amount >
    maximumAmount
  ) {
    throw new Error(
      `Pembayaran melebihi sisa yang dapat dibayar Rp${maximumAmount.toLocaleString("id-ID")}.`,
    );
  }

  // --------------------------------------------------------------------------
  // Update Payment
  // --------------------------------------------------------------------------

  const updated =
    await updatePaymentById(
      payment.id,
      {
        paymentDate:
          input.paymentDate,
        amount:
          input.amount.toFixed(2),
        method:
          input.method,
        referenceNumber:
          input.referenceNumber ||
          null,
        notes:
          input.notes ||
          null,
      },
    );

  if (!updated) {
    throw new Error(
      "Pembayaran gagal diperbarui.",
    );
  }

  // --------------------------------------------------------------------------
  // Recalculate Invoice
  // --------------------------------------------------------------------------

  const paidAmount =
    Number(
      await getInvoicePaidAmount(
        payment.invoiceId,
      ),
    );

  const remainingAmount =
    Math.max(
      invoiceTotal -
        paidAmount,
      0,
    );

  const invoiceStatus =
    paidAmount >= invoiceTotal
      ? "PAID"
      : paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

  // Edit payment SUCCESS selalu menghasilkan > 0,
  // tetapi tipe UNPAID tetap dihitung agar logic jelas.
  if (
    invoiceStatus ===
    "UNPAID"
  ) {
    throw new Error(
      "Total pembayaran invoice tidak valid.",
    );
  }

  await updateInvoicePaymentStatus(
    payment.invoiceId,
    invoiceStatus,
  );

  return {
    payment: updated,
    paidAmount,
    remainingAmount,
    invoiceStatus,
  };
}