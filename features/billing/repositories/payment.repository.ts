import {
  and,
  desc,
  eq,
  gte,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { invoices } from "@/db/schema/invoices";
import {
  payments,
  type NewPayment,
} from "@/db/schema/payments";

// ============================================================================
// Find Invoice
// ============================================================================

export async function findInvoiceForPayment(
  invoiceId: number,
) {
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber:
        invoices.invoiceNumber,
      total:
        invoices.total,
      status:
        invoices.status,
    })
    .from(invoices)
    .where(
      eq(
        invoices.id,
        invoiceId,
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

// ============================================================================
// Total Payment SUCCESS
// ============================================================================

export async function getInvoicePaidAmount(
  invoiceId: number,
) {
  const rows = await db
    .select({
      amount: sql<string>`
        COALESCE(
          SUM(${payments.amount}),
          0
        )::text
      `,
    })
    .from(payments)
    .where(
      sql`
        ${payments.invoiceId} = ${invoiceId}
        AND ${payments.status} = 'SUCCESS'
      `,
    );

  return rows[0]?.amount ?? "0";
}

// ============================================================================
// Create Payment
// ============================================================================

export async function insertPayment(
  value: NewPayment,
) {
  const rows = await db
    .insert(payments)
    .values(value)
    .returning({
      id: payments.id,
      paymentNumber:
        payments.paymentNumber,
      invoiceId:
        payments.invoiceId,
      amount:
        payments.amount,
    });

  return rows[0] ?? null;
}

// ============================================================================
// Update Invoice Status
// ============================================================================

export async function updateInvoicePaymentStatus(
  invoiceId: number,
  status:
    | "PARTIAL"
    | "PAID",
) {
  const rows = await db
    .update(invoices)
    .set({
      status,
      updatedAt:
        new Date(),
    })
    .where(
      eq(
        invoices.id,
        invoiceId,
      ),
    )
    .returning({
      id: invoices.id,
      status: invoices.status,
    });

  return rows[0] ?? null;
}

// ============================================================================
// Outstanding Invoice Customer
// ============================================================================

export async function listCustomerOutstandingInvoices(
  customerId: number,
  period?: string,
) {
  const paymentTotals =
    db
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

  const conditions = [
    eq(
      invoices.customerId,
      customerId,
    ),
    ne(
      invoices.status,
      "VOID",
    ),
  ];

  // --------------------------------------------------------------------------
  // Filter Bulan
  // AUTO   → billingPeriod
  // MANUAL → invoiceDate
  // --------------------------------------------------------------------------

  if (period) {
    const [year, month] =
      period
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
      `${period}-01`;

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
            period,
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

  const rows =
    await db
      .select({
        id: invoices.id,
        invoiceNumber:
          invoices.invoiceNumber,
        description:
          invoices.description,
        invoiceDate:
          invoices.invoiceDate,
        dueDate:
          invoices.dueDate,
        total:
          invoices.total,
        status:
          invoices.status,

        paidAmount:
          sql<string>`
            COALESCE(
              ${paymentTotals.paidAmount},
              0
            )
          `,

        remainingAmount:
          sql<string>`
            GREATEST(
              ${invoices.total} -
              COALESCE(
                ${paymentTotals.paidAmount},
                0
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
        and(
          ...conditions,
        ),
      )
      .orderBy(
        invoices.dueDate,
      );

  // Hanya invoice yang masih punya sisa.
  return rows.filter(
    (invoice) =>
      Number(
        invoice.remainingAmount,
      ) > 0,
  );
}

// ============================================================================
// Payment History Customer
// ============================================================================

export async function listCustomerPaymentHistory(
  customerId: number,
  period?: string,
) {
  const conditions = [
    eq(
      invoices.customerId,
      customerId,
    ),
  ];

  // --------------------------------------------------------------------------
  // Filter bulan sama dengan halaman Payment
  // AUTO   → billingPeriod
  // MANUAL → invoiceDate
  // --------------------------------------------------------------------------

  if (period) {
    const [year, month] =
      period.split("-").map(Number);

    const nextYear =
      month === 12
        ? year + 1
        : year;

    const nextMonth =
      month === 12
        ? 1
        : month + 1;

    const periodStart =
      `${period}-01`;

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
            period,
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

  return db
    .select({
      id:
        payments.id,
      paymentNumber:
        payments.paymentNumber,
      paymentDate:
        payments.paymentDate,
      amount:
        payments.amount,
      method:
        payments.method,
      referenceNumber:
        payments.referenceNumber,
      notes:
        payments.notes,
      status:
        payments.status,

      invoiceId:
        invoices.id,
      invoiceNumber:
        invoices.invoiceNumber,
      invoiceDescription:
        invoices.description,
    })
    .from(payments)
    .innerJoin(
      invoices,
      eq(
        invoices.id,
        payments.invoiceId,
      ),
    )
    .where(
      and(
        ...conditions,
      ),
    )
    .orderBy(
      desc(
        payments.paymentDate,
      ),
      desc(
        payments.id,
      ),
    );
}

// ============================================================================
// Find Payment for Edit
// ============================================================================

export async function findPaymentForEdit(
  paymentId: number,
) {
  const rows = await db
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      status: payments.status,
      amount: payments.amount,
      invoiceTotal: invoices.total,
      invoiceStatus: invoices.status,
    })
    .from(payments)
    .innerJoin(
      invoices,
      eq(
        invoices.id,
        payments.invoiceId,
      ),
    )
    .where(
      eq(
        payments.id,
        paymentId,
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

// ============================================================================
// Total Payment SUCCESS selain payment yang sedang diedit
// ============================================================================

export async function getOtherSuccessfulPaymentAmount(
  invoiceId: number,
  paymentId: number,
) {
  const rows = await db
    .select({
      amount: sql<string>`
        COALESCE(
          SUM(${payments.amount}),
          0
        )::text
      `,
    })
    .from(payments)
    .where(
      and(
        eq(
          payments.invoiceId,
          invoiceId,
        ),
        eq(
          payments.status,
          "SUCCESS",
        ),
        ne(
          payments.id,
          paymentId,
        ),
      ),
    );

  return rows[0]?.amount ?? "0";
}

// ============================================================================
// Update Payment
// ============================================================================

export async function updatePaymentById(
  paymentId: number,
  value: {
    paymentDate: string;
    amount: string;
    method:
      | "CASH"
      | "TRANSFER"
      | "QRIS"
      | "EWALLET"
      | "OTHER";
    referenceNumber: string | null;
    notes: string | null;
  },
) {
  const rows = await db
    .update(payments)
    .set({
      ...value,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          payments.id,
          paymentId,
        ),
        eq(
          payments.status,
          "SUCCESS",
        ),
      ),
    )
    .returning({
      id: payments.id,
      paymentNumber: payments.paymentNumber,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
    });

  return rows[0] ?? null;
}