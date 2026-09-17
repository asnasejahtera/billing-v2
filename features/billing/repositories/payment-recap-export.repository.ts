import {
  and,
  asc,
  eq,
  gte,
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

function nextMonth(month: string) {
  const [year, value] = month.split("-").map(Number);
  const nextYear = value === 12 ? year + 1 : year;
  const nextValue = value === 12 ? 1 : value + 1;
  return `${nextYear}-${String(nextValue).padStart(2, "0")}`;
}

// ============================================================================
// Customers
// ============================================================================

export async function listCustomersForPaymentRecapExport() {
  return db
    .select({
      id: customers.id,
      name: customers.name,
    })
    .from(customers)
    .orderBy(asc(customers.name));
}

// ============================================================================
// Invoice Bulanan
// Digunakan untuk TANGGAL BAYAR + TAGIHAN bulan terakhir.
// ============================================================================

export async function listInvoicesForPaymentRecapExport(
  months: string[],
) {
  const monthConditions = months.map((month) => {
    const next = nextMonth(month);

    return or(
      and(
        eq(invoices.source, "AUTO"),
        eq(invoices.billingPeriod, month),
      ),
      and(
        eq(invoices.source, "MANUAL"),
        gte(invoices.invoiceDate, `${month}-01`),
        lt(invoices.invoiceDate, `${next}-01`),
      ),
    );
  });

  const periodCondition = or(...monthConditions);

  if (!periodCondition) {
    return [];
  }

  return db
    .select({
      id: invoices.id,
      customerId: invoices.customerId,
      billingPeriod: invoices.billingPeriod,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      source: invoices.source,
    })
    .from(invoices)
    .where(
      and(
        ne(invoices.status, "VOID"),
        periodCondition,
      ),
    );
}

// ============================================================================
// Payments
// Bulan ditentukan berdasarkan paymentDate.
// ============================================================================

export async function listPaymentsForPaymentRecapExport(
  months: string[],
) {
  const monthConditions = months.map((month) => {
    const next = nextMonth(month);

    return and(
      gte(payments.paymentDate, `${month}-01`),
      lt(payments.paymentDate, `${next}-01`),
    );
  });

  const periodCondition = or(...monthConditions);

  if (!periodCondition) {
    return [];
  }

  return db
    .select({
      id: payments.id,
      customerId: invoices.customerId,
      paymentDate: payments.paymentDate,
      method: payments.method,
    })
    .from(payments)
    .innerJoin(
      invoices,
      eq(invoices.id, payments.invoiceId),
    )
    .where(
      and(
        eq(payments.status, "SUCCESS"),
        ne(invoices.status, "VOID"),
        periodCondition,
      ),
    )
    .orderBy(
      asc(payments.paymentDate),
      asc(payments.id),
    );
}