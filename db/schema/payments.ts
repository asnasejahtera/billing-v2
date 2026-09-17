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
import { invoices } from "./invoices";

// ============================================================================
// Types
// ============================================================================

export type PaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "QRIS"
  | "EWALLET"
  | "OTHER";

export type PaymentStatus =
  | "SUCCESS"
  | "VOID";

// ============================================================================
// Payments
// ============================================================================

export const payments = pgTable(
  "payments",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    paymentNumber: varchar("payment_number", {
      length: 60,
    }).notNull(),

    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "restrict",
      }),

    paymentDate: date("payment_date")
      .notNull(),

    amount: numeric("amount", {
      precision: 14,
      scale: 2,
    }).notNull(),

    method: varchar("method", {
      length: 30,
    })
      .$type<PaymentMethod>()
      .notNull(),

    referenceNumber: varchar("reference_number", {
      length: 150,
    }),

    notes: text("notes"),

    status: varchar("status", {
      length: 20,
    })
      .$type<PaymentStatus>()
      .notNull()
      .default("SUCCESS"),

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
    uniqueIndex(
      "payments_payment_number_unique",
    ).on(table.paymentNumber),

    index(
      "payments_invoice_id_idx",
    ).on(table.invoiceId),

    index(
      "payments_payment_date_idx",
    ).on(table.paymentDate),

    index(
      "payments_method_idx",
    ).on(table.method),

    index(
      "payments_status_idx",
    ).on(table.status),

    check(
      "payments_amount_positive_check",
      sql`${table.amount} > 0`,
    ),
  ],
);

export type Payment =
  typeof payments.$inferSelect;

export type NewPayment =
  typeof payments.$inferInsert;