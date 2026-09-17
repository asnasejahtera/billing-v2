import type { NewInvoice } from "@/db/schema/invoices";

import {
  insertGeneratedInvoices,
  listActiveCustomersForInvoiceGeneration,
  listExistingAutoInvoiceCustomerIds,
} from "../repositories/invoice.repository";

import type {
  GenerateInvoicesInput,
} from "../schemas/generate-invoices.schema";

// ============================================================================
// Types
// ============================================================================

export type GenerateInvoicesResult = {
  totalActive: number;
  created: number;
  skipped: number;
  invoiceDate: string;
  dueDate: string;
};

// ============================================================================
// Resolve Tanggal dalam Bulan
// ============================================================================

function resolveBillingDate(
  billingPeriod: string,
  requestedDay: number,
) {
  const [
    yearString,
    monthString,
  ] = billingPeriod.split("-");

  const year = Number(yearString);
  const month = Number(monthString);

  const lastDay = new Date(
    Date.UTC(
      year,
      month,
      0,
    ),
  ).getUTCDate();

  const day = Math.min(
    requestedDay,
    lastDay,
  );

  return `${billingPeriod}-${String(day).padStart(2, "0")}`;
}

// ============================================================================
// Generate Nomor Invoice AUTO
// ============================================================================

function createAutoInvoiceNumber(
  billingPeriod: string,
  customerId: number,
) {
  const period =
    billingPeriod.replace("-", "");

  return `INV-${period}-${String(customerId).padStart(6, "0")}`;
}

// ============================================================================
// Generate Invoice Bulanan
// ============================================================================

export async function generateMonthlyInvoicesService(
  input: GenerateInvoicesInput,
): Promise<GenerateInvoicesResult> {
  // --------------------------------------------------------------------------
  // Resolve tanggal invoice + jatuh tempo
  // --------------------------------------------------------------------------

  const invoiceDate =
    resolveBillingDate(
      input.billingPeriod,
      input.invoiceDay,
    );

  const dueDate =
    resolveBillingDate(
      input.billingPeriod,
      input.dueDay,
    );

  if (dueDate < invoiceDate) {
    throw new Error(
      "Tanggal jatuh tempo tidak boleh sebelum tanggal invoice.",
    );
  }

  // --------------------------------------------------------------------------
  // Ambil customer aktif + invoice existing secara paralel
  // --------------------------------------------------------------------------

  const [
    customers,
    existingCustomerIds,
  ] = await Promise.all([
    listActiveCustomersForInvoiceGeneration(),
    listExistingAutoInvoiceCustomerIds(
      input.billingPeriod,
    ),
  ]);

  // --------------------------------------------------------------------------
  // Skip invoice yang sudah pernah digenerate
  // --------------------------------------------------------------------------

  const availableCustomers =
    customers.filter(
      (customer) =>
        !existingCustomerIds.has(
          customer.customerId,
        ),
    );

  // --------------------------------------------------------------------------
  // Snapshot paket customer ke invoice
  // --------------------------------------------------------------------------

  const values: NewInvoice[] =
    availableCustomers.map(
      (customer) => ({
        invoiceNumber:
          createAutoInvoiceNumber(
            input.billingPeriod,
            customer.customerId,
          ),

        customerId:
          customer.customerId,

        internetPlanId:
          customer.internetPlanId,

        billingPeriod:
          input.billingPeriod,

        invoiceDate,
        dueDate,

        description:
          `Tagihan internet ${customer.planName} periode ${input.billingPeriod}`,

        planName:
          customer.planName,

        planPrice:
          customer.planPrice,

        total:
          customer.planPrice,

        source:
          "AUTO",

        status:
          "UNPAID",
      }),
    );

  // --------------------------------------------------------------------------
  // Insert sekaligus, unique constraint tetap menjadi proteksi terakhir
  // --------------------------------------------------------------------------

  const inserted =
    await insertGeneratedInvoices(
      values,
    );

  return {
    totalActive:
      customers.length,

    created:
      inserted.length,

    skipped:
      customers.length -
      inserted.length,

    invoiceDate,
    dueDate,
  };
}