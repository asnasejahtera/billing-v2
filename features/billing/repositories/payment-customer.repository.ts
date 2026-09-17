import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  or,
  sql,
  ne
} from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";
import { invoices } from "@/db/schema/invoices";
import { payments } from "@/db/schema/payments";

import type {
  PaymentCustomerListQuery,
} from "../schemas/payment-customer-list.schema";

// ============================================================================
// Types
// ============================================================================

type PaymentCustomerRepositoryInput =
  PaymentCustomerListQuery & {
    today: string;
  };

// ============================================================================
// Payment Customer List
// ============================================================================

export async function listPaymentCustomers(
  input: PaymentCustomerRepositoryInput,
) {
  // ==========================================================================
  // Payment Aggregate per Invoice
  // ==========================================================================

  const paymentTotals = db
    .select({
      invoiceId: payments.invoiceId,
      paidAmount: sql<string>`
        COALESCE(SUM(${payments.amount}), 0)
      `.as("paid_amount"),
    })
    .from(payments)
    .where(
      eq(
        payments.status,
        "SUCCESS",
      ),
    )
    .groupBy(
      payments.invoiceId,
    )
    .as("payment_totals");

  // ==========================================================================
  // Invoice Period Filter
  // AUTO   -> billingPeriod
  // MANUAL -> invoiceDate
  // ==========================================================================

  const invoiceConditions = [];

  if (input.period) {
    const [year, month] =
      input.period.split("-").map(Number);

    const nextYear =
      month === 12
        ? year + 1
        : year;

    const nextMonth =
      month === 12
        ? 1
        : month + 1;

    const periodStart =
      `${input.period}-01`;

    const nextPeriodStart =
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    invoiceConditions.push(
      or(
        and(
          eq(
            invoices.source,
            "AUTO",
          ),
          eq(
            invoices.billingPeriod,
            input.period,
          ),
        ),
        and(
          eq(
            invoices.source,
            "MANUAL",
          ),
          gte(
            invoices.invoiceDate,
            periodStart,
          ),
          lt(
            invoices.invoiceDate,
            nextPeriodStart,
          ),
        ),
      ),
    );
  }

  // ==========================================================================
  // Hitung Kurang Bayar + Tunggakan seluruh customer
  // ==========================================================================

  const debtRows = await db
    .select({
      customerId:
        invoices.customerId,

      outstanding: sql<string>`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.status} <> 'VOID'
              THEN GREATEST(
                ${invoices.total} -
                COALESCE(${paymentTotals.paidAmount}, 0),
                0
              )
              ELSE 0
            END
          ),
          0
        )
      `,

      overdue: sql<string>`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.status} <> 'VOID'
                AND ${invoices.dueDate} < ${input.today}
              THEN GREATEST(
                ${invoices.total} -
                COALESCE(${paymentTotals.paidAmount}, 0),
                0
              )
              ELSE 0
            END
          ),
          0
        )
      `,
    })
    .from(invoices)
    .leftJoin(
      paymentTotals,
      eq(
        paymentTotals.invoiceId,
        invoices.id,
      ),
    )
    .where(
      invoiceConditions.length > 0
        ? and(...invoiceConditions)
        : undefined,
    )
    .groupBy(
      invoices.customerId,
    );

  const debtMap =
    new Map(
      debtRows.map((row) => [
        row.customerId,
        {
          outstanding:
            row.outstanding,
          overdue:
            row.overdue,
        },
      ]),
    );

  // ==========================================================================
  // Filter Customer Berdasarkan Tagihan
  // Harus dilakukan sebelum pagination.
  // ==========================================================================

  let debtCustomerIds:
    number[] | null = null;

  if (
    input.debtStatus ===
    "OUTSTANDING"
  ) {
    debtCustomerIds =
      debtRows
        .filter(
          (row) =>
            Number(
              row.outstanding,
            ) > 0,
        )
        .map(
          (row) =>
            row.customerId,
        );
  }

  if (
    input.debtStatus ===
    "OVERDUE"
  ) {
    debtCustomerIds =
      debtRows
        .filter(
          (row) =>
            Number(
              row.overdue,
            ) > 0,
        )
        .map(
          (row) =>
            row.customerId,
        );
  }

  if (
    debtCustomerIds &&
    debtCustomerIds.length === 0
  ) {
    return {
      data: [],
      total: 0,
    };
  }

  // ==========================================================================
  // Customer Filters
  // ==========================================================================

  const customerConditions = [];

  if (input.q) {
    customerConditions.push(
      or(
        ilike(
          customers.name,
          `%${input.q}%`,
        ),
        ilike(
          customers.address,
          `%${input.q}%`,
        ),
      ),
    );
  }

  if (input.status) {
    customerConditions.push(
      eq(
        customers.status,
        input.status,
      ),
    );
  }

  if (debtCustomerIds) {
    customerConditions.push(
      inArray(
        customers.id,
        debtCustomerIds,
      ),
    );
  }

  const customerWhere =
    customerConditions.length > 0
      ? and(
          ...customerConditions,
        )
      : undefined;

  // ==========================================================================
  // Normal Sorting
  // ==========================================================================

  const sortColumn =
    input.sort === "status"
      ? customers.status
      : customers.name;

  const orderBy =
    input.order === "desc"
      ? desc(sortColumn)
      : asc(sortColumn);

  // ==========================================================================
  // Customer Query
  // ==========================================================================

  const baseCustomerQuery = () =>
    db
      .select({
        id:
          customers.id,
        name:
          customers.name,
        address:
          customers.address,
        status:
          customers.status,
      })
      .from(customers)
      .where(
        customerWhere,
      )
      .orderBy(
        orderBy,
      );

  const customerPromise =
    input.pageSize === "all"
      ? baseCustomerQuery()
      : baseCustomerQuery()
          .limit(
            input.pageSize,
          )
          .offset(
            (input.page - 1) *
              input.pageSize,
          );

  const [
    customerRows,
    totalRows,
  ] = await Promise.all([
    customerPromise,

    db
      .select({
        value:
          count(),
      })
      .from(customers)
      .where(
        customerWhere,
      ),
  ]);

  let data =
    customerRows.map(
      (customer) => {
        const debt =
          debtMap.get(
            customer.id,
          );

        return {
          ...customer,

          outstanding:
            debt?.outstanding ??
            "0",

          overdue:
            debt?.overdue ??
            "0",
        };
      },
    );

  // ==========================================================================
  // Debt Sorting
  // ==========================================================================

  if (
    input.sort ===
      "outstanding" ||
    input.sort ===
      "overdue"
  ) {
    const field =
      input.sort;

    data = data.sort(
      (a, b) => {
        const difference =
          Number(a[field]) -
          Number(b[field]);

        return input.order ===
          "desc"
          ? -difference
          : difference;
      },
    );
  }

  return {
    data,
    total:
      Number(
        totalRows[0]?.value ??
          0,
      ),
  };
}

// ============================================================================
// Billing Summary
// ============================================================================

export async function getPaymentBillingSummary(
  input: {
    period?: string;
    today: string;
  },
) {
  // --------------------------------------------------------------------------
  // Payment SUCCESS per Invoice
  // --------------------------------------------------------------------------

  const paymentTotals = db
    .select({
      invoiceId: payments.invoiceId,
      paidAmount: sql<string>`
        COALESCE(
          SUM(${payments.amount}),
          0
        )
      `.as("paid_amount"),
    })
    .from(payments)
    .where(
      eq(
        payments.status,
        "SUCCESS",
      ),
    )
    .groupBy(
      payments.invoiceId,
    )
    .as("payment_totals");

  // --------------------------------------------------------------------------
  // Invoice Filter
  // --------------------------------------------------------------------------

  const conditions = [
    ne(
      invoices.status,
      "VOID",
    ),
  ];

  // --------------------------------------------------------------------------
  // Periode
  // AUTO   → billingPeriod
  // MANUAL → invoiceDate
  // --------------------------------------------------------------------------

  if (input.period) {
    const [year, month] =
      input.period
        .split("-")
        .map(Number);

    const nextYear =
      month === 12
        ? year + 1
        : year;

    const nextMonth =
      month === 12
        ? 1
        : month + 1;

    const periodStart =
      `${input.period}-01`;

    const nextPeriodStart =
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    conditions.push(
      or(
        and(
          eq(
            invoices.source,
            "AUTO",
          ),
          eq(
            invoices.billingPeriod,
            input.period,
          ),
        ),
        and(
          eq(
            invoices.source,
            "MANUAL",
          ),
          gte(
            invoices.invoiceDate,
            periodStart,
          ),
          lt(
            invoices.invoiceDate,
            nextPeriodStart,
          ),
        ),
      )!,
    );
  }

  // --------------------------------------------------------------------------
  // Aggregate per Customer
  // Customer lunas = seluruh invoice customer pada periode sudah lunas.
  // --------------------------------------------------------------------------

  const customerSummary = db
    .select({
      customerId:
        invoices.customerId,

      invoiceCount: sql<number>`
        COUNT(${invoices.id})::int
      `.as("invoice_count"),

      unpaidInvoiceCount: sql<number>`
        COUNT(*) FILTER (
          WHERE GREATEST(
            ${invoices.total} -
            COALESCE(
              ${paymentTotals.paidAmount},
              0
            ),
            0
          ) > 0
        )::int
      `.as("unpaid_invoice_count"),

      paidInvoiceCount: sql<number>`
        COUNT(*) FILTER (
          WHERE GREATEST(
            ${invoices.total} -
            COALESCE(
              ${paymentTotals.paidAmount},
              0
            ),
            0
          ) = 0
        )::int
      `.as("paid_invoice_count"),

      totalInvoice: sql<string>`
        COALESCE(
          SUM(${invoices.total}),
          0
        )
      `.as("total_invoice"),

      totalPaid: sql<string>`
        COALESCE(
          SUM(
            LEAST(
              COALESCE(
                ${paymentTotals.paidAmount},
                0
              ),
              ${invoices.total}
            )
          ),
          0
        )
      `.as("total_paid"),

      outstanding: sql<string>`
        COALESCE(
          SUM(
            GREATEST(
              ${invoices.total} -
              COALESCE(
                ${paymentTotals.paidAmount},
                0
              ),
              0
            )
          ),
          0
        )
      `.as("outstanding"),

      overdue: sql<string>`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.dueDate} < ${input.today}
              THEN GREATEST(
                ${invoices.total} -
                COALESCE(
                  ${paymentTotals.paidAmount},
                  0
                ),
                0
              )
              ELSE 0
            END
          ),
          0
        )
      `.as("overdue"),
    })
    .from(invoices)
    .leftJoin(
      paymentTotals,
      eq(
        paymentTotals.invoiceId,
        invoices.id,
      ),
    )
    .where(
      and(
        ...conditions,
      ),
    )
    .groupBy(
      invoices.customerId,
    )
    .as("customer_billing_summary");

  // --------------------------------------------------------------------------
  // Global Summary
  // --------------------------------------------------------------------------

  const rows = await db
    .select({
      invoiceCount: sql<number>`
        COALESCE(
          SUM(${customerSummary.invoiceCount}),
          0
        )::int
      `,

      unpaidInvoiceCount: sql<number>`
        COALESCE(
          SUM(${customerSummary.unpaidInvoiceCount}),
          0
        )::int
      `,

      paidInvoiceCount: sql<number>`
        COALESCE(
          SUM(${customerSummary.paidInvoiceCount}),
          0
        )::int
      `,

      unpaidCustomerCount: sql<number>`
        COUNT(*) FILTER (
          WHERE ${customerSummary.unpaidInvoiceCount} > 0
        )::int
      `,

      paidCustomerCount: sql<number>`
        COUNT(*) FILTER (
          WHERE ${customerSummary.unpaidInvoiceCount} = 0
        )::int
      `,

      totalInvoice: sql<string>`
        COALESCE(
          SUM(${customerSummary.totalInvoice}),
          0
        )
      `,

      totalPaid: sql<string>`
        COALESCE(
          SUM(${customerSummary.totalPaid}),
          0
        )
      `,

      outstanding: sql<string>`
        COALESCE(
          SUM(${customerSummary.outstanding}),
          0
        )
      `,

      overdue: sql<string>`
        COALESCE(
          SUM(${customerSummary.overdue}),
          0
        )
      `,
    })
    .from(
      customerSummary,
    );

  return {
    invoiceCount:
      rows[0]?.invoiceCount ?? 0,

    unpaidInvoiceCount:
      rows[0]?.unpaidInvoiceCount ?? 0,

    paidInvoiceCount:
      rows[0]?.paidInvoiceCount ?? 0,

    unpaidCustomerCount:
      rows[0]?.unpaidCustomerCount ?? 0,

    paidCustomerCount:
      rows[0]?.paidCustomerCount ?? 0,

    totalInvoice:
      rows[0]?.totalInvoice ?? "0",

    totalPaid:
      rows[0]?.totalPaid ?? "0",

    outstanding:
      rows[0]?.outstanding ?? "0",

    overdue:
      rows[0]?.overdue ?? "0",
  };
}