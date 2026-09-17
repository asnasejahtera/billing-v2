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

function nextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const nextYear =
    monthNumber === 12
      ? year + 1
      : year;

  const nextMonthNumber =
    monthNumber === 12
      ? 1
      : monthNumber + 1;

  return `${nextYear}-${String(nextMonthNumber).padStart(2, "0")}`;
}

// ============================================================================
// Customers
// ============================================================================

export async function listCustomersForBillingExport() {
  return db
    .select({
      id: customers.id,
      pppoeUsername: customers.pppoeUsername,
      name: customers.name,
    })
    .from(customers)
    .orderBy(
      asc(customers.name),
    );
}

// ============================================================================
// Invoices
// AUTO   -> billingPeriod
// MANUAL -> invoiceDate month
// ============================================================================

export async function listInvoicesForBillingExport(
  months: string[],
) {
  const manualConditions = months.map((month) => {
    const next = nextMonth(month);

    return and(
      eq(
        invoices.source,
        "MANUAL",
      ),
      gte(
        invoices.invoiceDate,
        `${month}-01`,
      ),
      lt(
        invoices.invoiceDate,
        `${next}-01`,
      ),
    );
  });

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
        ne(
          invoices.status,
          "VOID",
        ),
        or(
          and(
            eq(
              invoices.source,
              "AUTO",
            ),
            inArray(
              invoices.billingPeriod,
              months,
            ),
          ),
          ...manualConditions,
        ),
      ),
    );
}

// ============================================================================
// Payments
// ============================================================================

export async function listPaymentsForBillingExport(
  invoiceIds: number[],
) {
  if (invoiceIds.length === 0) {
    return [];
  }

  return db
    .select({
      invoiceId: payments.invoiceId,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
    })
    .from(payments)
    .where(
      and(
        inArray(
          payments.invoiceId,
          invoiceIds,
        ),
        eq(
          payments.status,
          "SUCCESS",
        ),
      ),
    );
}