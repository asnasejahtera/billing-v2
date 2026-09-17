import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  lt,
  notInArray,
  or,
  gte
} from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";
import { internetPlans } from "@/db/schema/internet-plans";
import {
  invoices,
  type NewInvoice,
} from "@/db/schema/invoices";

import type {
  BillingListQuery,
} from "../schemas/billing-list.schema";

// ============================================================================
// Generate Invoice
// ============================================================================

export async function listActiveCustomersForInvoiceGeneration() {
  return db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      internetPlanId: internetPlans.id,
      planName: internetPlans.name,
      planPrice: internetPlans.price,
    })
    .from(customers)
    .innerJoin(
      internetPlans,
      eq(internetPlans.id, customers.internetPlanId),
    )
    .where(
      eq(customers.status, "ACTIVE"),
    );
}

export async function listExistingAutoInvoiceCustomerIds(
  billingPeriod: string,
) {
  const rows = await db
    .select({
      customerId: invoices.customerId,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.billingPeriod, billingPeriod),
        eq(invoices.source, "AUTO"),
      ),
    );

  return new Set(
    rows.map((row) => row.customerId),
  );
}

export async function insertGeneratedInvoices(
  values: NewInvoice[],
) {
  if (values.length === 0) return [];

  return db
    .insert(invoices)
    .values(values)
    .onConflictDoNothing()
    .returning({
      id: invoices.id,
      customerId: invoices.customerId,
      invoiceNumber: invoices.invoiceNumber,
    });
}

// ============================================================================
// Manual Invoice Customer
// ============================================================================

export async function listCustomersForManualInvoice() {
  return db
    .select({
      id: customers.id,
      name: customers.name,
      status: customers.status,
      planName: internetPlans.name,
    })
    .from(customers)
    .innerJoin(
      internetPlans,
      eq(internetPlans.id, customers.internetPlanId),
    )
    .orderBy(
      asc(customers.name),
    );
}

export async function findCustomerForManualInvoice(
  customerId: number,
) {
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
    })
    .from(customers)
    .where(
      eq(customers.id, customerId),
    )
    .limit(1);

  return rows[0] ?? null;
}

// ============================================================================
// Create Manual Invoice
// ============================================================================

export async function createManualInvoice(
  value: NewInvoice,
) {
  const rows = await db
    .insert(invoices)
    .values(value)
    .returning({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      total: invoices.total,
      status: invoices.status,
    });

  return rows[0];
}

// ============================================================================
// Billing List
// ============================================================================

type BillingListRepositoryInput =
  BillingListQuery & {
    today: string;
  };

export async function listInvoices(
  input: BillingListRepositoryInput,
) {
  const conditions = [];

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  if (input.q) {
    conditions.push(
      or(
        ilike(
          invoices.invoiceNumber,
          `%${input.q}%`,
        ),
        ilike(
          customers.name,
          `%${input.q}%`,
        ),
        ilike(
          invoices.description,
          `%${input.q}%`,
        ),
      ),
    );
  }
  // --------------------------------------------------------------------------
  // Period
  // AUTO   → billingPeriod
  // MANUAL → invoiceDate pada bulan yang dipilih
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
      ),
    );
  }

  // --------------------------------------------------------------------------
  // Source
  // --------------------------------------------------------------------------

  if (input.source) {
    conditions.push(
      eq(
        invoices.source,
        input.source,
      ),
    );
  }

  // --------------------------------------------------------------------------
  // Status
  // VOID disembunyikan secara default.
  // Masih bisa dilihat melalui filter status VOID.
  // --------------------------------------------------------------------------

  if (input.status === "OVERDUE") {
    conditions.push(
      lt(
        invoices.dueDate,
        input.today,
      ),
    );

    conditions.push(
      notInArray(
        invoices.status,
        ["PAID", "VOID"],
      ),
    );
  } else if (input.status) {
    conditions.push(
      eq(
        invoices.status,
        input.status,
      ),
    );
  } else {
    conditions.push(
      notInArray(
        invoices.status,
        ["VOID"],
      ),
    );
  }

  const where =
    conditions.length > 0
      ? and(...conditions)
      : undefined;

  // --------------------------------------------------------------------------
  // Sorting
  // --------------------------------------------------------------------------

  const sortColumn = (() => {
    switch (input.sort) {
      case "invoiceNumber":
        return invoices.invoiceNumber;
      case "customer":
        return customers.name;
      case "dueDate":
        return invoices.dueDate;
      case "total":
        return invoices.total;
      case "status":
        return invoices.status;
      case "invoiceDate":
      default:
        return invoices.invoiceDate;
    }
  })();

  const orderBy =
    input.order === "asc"
      ? asc(sortColumn)
      : desc(sortColumn);

  // --------------------------------------------------------------------------
  // Pagination
  // --------------------------------------------------------------------------

  const limit =
  input.pageSize === "all"
    ? 2_147_483_647
    : input.pageSize;

  const offset =
    input.pageSize === "all"
      ? 0
      : (input.page - 1) *
        input.pageSize;

  const [
    data,
    totalResult,
  ] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNumber:
          invoices.invoiceNumber,
        customerId:
          invoices.customerId,
        customerName:
          customers.name,
        billingPeriod:
          invoices.billingPeriod,
        invoiceDate:
          invoices.invoiceDate,
        dueDate:
          invoices.dueDate,
        description:
          invoices.description,
        planName:
          invoices.planName,
        planPrice:
          invoices.planPrice,
        total:
          invoices.total,
        source:
          invoices.source,
        status:
          invoices.status,
        notes: invoices.notes,
      })
      .from(invoices)
      .innerJoin(
        customers,
        eq(
          customers.id,
          invoices.customerId,
        ),
      )
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),

    db
      .select({
        value: count(),
      })
      .from(invoices)
      .innerJoin(
        customers,
        eq(
          customers.id,
          invoices.customerId,
        ),
      )
      .where(where),
  ]);

  return {
    data,
    total:
      Number(
        totalResult[0]?.value ?? 0,
      ),
  };
}

// ============================================================================
// Find Invoice untuk Mutation
// ============================================================================

export async function findInvoiceForMutation(
  id: number,
) {
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      source: invoices.source,
    })
    .from(invoices)
    .where(
      eq(
        invoices.id,
        id,
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

// ============================================================================
// Edit Invoice
// ============================================================================

export async function updateInvoiceById(
  id: number,
  value: {
    description: string;
    total: string;
    invoiceDate: string;
    dueDate: string;
    notes: string | null;
  },
) {
  const rows = await db
    .update(invoices)
    .set({
      ...value,
      updatedAt: new Date(),
    })
    .where(
      eq(
        invoices.id,
        id,
      ),
    )
    .returning({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      total: invoices.total,
      status: invoices.status,
    });

  return rows[0] ?? null;
}

// ============================================================================
// Safe Delete Invoice → VOID
// ============================================================================

export async function voidInvoiceById(
  id: number,
  reason: string,
) {
  const rows = await db
    .update(invoices)
    .set({
      status: "VOID",
      voidReason: reason,
      voidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      eq(
        invoices.id,
        id,
      ),
    )
    .returning({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
    });

  return rows[0] ?? null;
}