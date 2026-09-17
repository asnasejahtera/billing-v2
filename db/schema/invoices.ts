import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { customers } from "./cusotmers";
import { internetPlans } from "./internet-plans";

// ============================================================================
// Types
// ============================================================================

export type InvoiceSource =
  | "AUTO"
  | "MANUAL";

export type InvoiceStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "VOID";

// ============================================================================
// Invoices
// ============================================================================

export const invoices = pgTable(
  "invoices",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    invoiceNumber: varchar("invoice_number", {
      length: 50,
    }).notNull(),

    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, {
        onDelete: "restrict",
      }),

    // Referensi paket saat invoice dibuat.
    // Nullable agar invoice manual tidak wajib memakai paket internet.
    internetPlanId: integer("internet_plan_id")
      .references(() => internetPlans.id, {
        onDelete: "set null",
      }),

    // Format YYYY-MM, contoh: 2026-09.
    // Wajib untuk invoice AUTO, optional untuk invoice MANUAL.
    billingPeriod: varchar("billing_period", {
      length: 7,
    }),

    invoiceDate: date("invoice_date")
      .notNull(),

    dueDate: date("due_date")
      .notNull(),

    description: varchar("description", {
      length: 500,
    }).notNull(),

    // Snapshot paket agar invoice lama tidak berubah
    // ketika nama/harga paket berubah.
    planName: varchar("plan_name", {
      length: 150,
    }),

    planPrice: numeric("plan_price", {
      precision: 14,
      scale: 2,
    }),

    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull(),

    source: varchar("source", {
      length: 20,
    })
      .$type<InvoiceSource>()
      .notNull()
      .default("MANUAL"),

    status: varchar("status", {
      length: 20,
    })
      .$type<InvoiceStatus>()
      .notNull()
      .default("UNPAID"),

    notes: text("notes"),

    // Dipakai nanti untuk pembatalan invoice tanpa hard delete.
    voidReason: text("void_reason"),

    voidedAt: timestamp("voided_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // ========================================================================
    // Unique
    // ========================================================================

    uniqueIndex(
      "invoices_invoice_number_unique",
    ).on(
      table.invoiceNumber,
    ),

    // Invoice AUTO customer yang sama hanya boleh satu kali
    // pada periode billing yang sama.
    uniqueIndex(
      "invoices_customer_period_auto_unique",
    )
      .on(
        table.customerId,
        table.billingPeriod,
      )
      .where(
        sql`${table.source} = 'AUTO'`,
      ),

    // ========================================================================
    // Index
    // ========================================================================

    index(
      "invoices_customer_id_idx",
    ).on(
      table.customerId,
    ),

    index(
      "invoices_internet_plan_id_idx",
    ).on(
      table.internetPlanId,
    ),

    index(
      "invoices_billing_period_idx",
    ).on(
      table.billingPeriod,
    ),

    index(
      "invoices_invoice_date_idx",
    ).on(
      table.invoiceDate,
    ),

    index(
      "invoices_due_date_idx",
    ).on(
      table.dueDate,
    ),

    index(
      "invoices_status_idx",
    ).on(
      table.status,
    ),

    index(
      "invoices_source_idx",
    ).on(
      table.source,
    ),

    // ========================================================================
    // Validation
    // ========================================================================

    check(
      "invoices_total_non_negative_check",
      sql`${table.total} >= 0`,
    ),

    check(
      "invoices_due_date_check",
      sql`${table.dueDate} >= ${table.invoiceDate}`,
    ),

    check(
      "invoices_auto_period_required_check",
      sql`
        ${table.source} <> 'AUTO'
        OR ${table.billingPeriod} IS NOT NULL
      `,
    ),
  ],
);

// ============================================================================
// Infer Types
// ============================================================================

export type Invoice =
  typeof invoices.$inferSelect;

export type NewInvoice =
  typeof invoices.$inferInsert;