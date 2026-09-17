import {
  and,
  asc,
  eq,
  gte,
  inArray,
  lt,
  ne,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";
import { invoices } from "@/db/schema/invoices";
import { payments } from "@/db/schema/payments";

// ============================================================================
// Helpers
// ============================================================================

function getMonthRange(month: string) {
  const [year, value] = month.split("-").map(Number);
  const nextYear = value === 12 ? year + 1 : year;
  const nextMonth = value === 12 ? 1 : value + 1;

  return {
    start: `${month}-01`,
    next: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

// ============================================================================
// Invoice
// AUTO   -> billingPeriod
// MANUAL -> invoiceDate
// ============================================================================

export async function listInvoicesForInstallmentExport(
  month: string,
) {
  const range = getMonthRange(month);

  return db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: customers.name,
      billingPeriod: invoices.billingPeriod,
      invoiceDate: invoices.invoiceDate,
      total: invoices.total,
      source: invoices.source,
    })
    .from(invoices)
    .innerJoin(
      customers,
      eq(customers.id, invoices.customerId),
    )
    .where(
      and(
        ne(invoices.status, "VOID"),
        or(
          and(
            eq(invoices.source, "AUTO"),
            eq(invoices.billingPeriod, month),
          ),
          and(
            eq(invoices.source, "MANUAL"),
            gte(invoices.invoiceDate, range.start),
            lt(invoices.invoiceDate, range.next),
          ),
        ),
      ),
    )
    .orderBy(
      asc(customers.name),
      asc(invoices.invoiceNumber),
    );
}

// ============================================================================
// Payment
// Semua pembayaran SUCCESS milik invoice yang dipilih.
// Tidak dibatasi paymentDate ke bulan invoice karena pembayaran dapat dicicil
// pada bulan berikutnya.
// ============================================================================

export async function listPaymentsForInstallmentExport(
  invoiceIds: number[],
) {
  if (invoiceIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      method: payments.method,
    })
    .from(payments)
    .where(
      and(
        inArray(payments.invoiceId, invoiceIds),
        eq(payments.status, "SUCCESS"),
      ),
    )
    .orderBy(
      asc(payments.invoiceId),
      asc(payments.paymentDate),
      asc(payments.id),
    );
}