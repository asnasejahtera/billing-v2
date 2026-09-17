import { randomUUID } from "node:crypto";

import {
  createManualInvoice,
  findCustomerForManualInvoice,
  listCustomersForManualInvoice,
} from "../repositories/invoice.repository";
import type {
  CreateManualInvoiceInput,
} from "../schemas/manual-invoice.schema";

// ============================================================================
// Invoice Number
// ============================================================================

function createManualInvoiceNumber(
  invoiceDate: string,
) {
  const date =
    invoiceDate.replaceAll("-", "");

  const suffix =
    randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase();

  return `INV-M-${date}-${suffix}`;
}

// ============================================================================
// Customer Options
// ============================================================================

export async function listManualInvoiceCustomersService() {
  return listCustomersForManualInvoice();
}

// ============================================================================
// Create Manual Invoice
// ============================================================================

export async function createManualInvoiceService(
  input: CreateManualInvoiceInput,
) {
  const customer =
    await findCustomerForManualInvoice(
      input.customerId,
    );

  if (!customer) {
    throw new Error(
      "Customer tidak ditemukan.",
    );
  }

  const amount =
    input.amount.toFixed(2);

  const invoice =
    await createManualInvoice({
      invoiceNumber:
        createManualInvoiceNumber(
          input.invoiceDate,
        ),
      customerId:
        input.customerId,
      internetPlanId: null,
      billingPeriod: null,
      invoiceDate:
        input.invoiceDate,
      dueDate:
        input.dueDate,
      description:
        input.description,
      planName: null,
      planPrice: null,
      total: amount,
      source: "MANUAL",
      status: "UNPAID",
      notes:
        input.notes || null,
    });

  if (!invoice) {
    throw new Error(
      "Invoice manual gagal dibuat.",
    );
  }

  return invoice;
}