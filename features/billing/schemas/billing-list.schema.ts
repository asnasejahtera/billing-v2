import { z } from "zod";

// ============================================================================
// Helpers
// ============================================================================

const emptyToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

// ============================================================================
// Billing List Query
// ============================================================================

export const billingListQuerySchema = z.object({
  q: z.string().trim().max(150).optional().default(""),

  period: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(
        /^\d{4}-(0[1-9]|1[0-2])$/,
        "Periode billing tidak valid.",
      )
      .optional(),
  ),

  status: z.preprocess(
    emptyToUndefined,
    z
      .enum([
        "UNPAID",
        "PARTIAL",
        "PAID",
        "VOID",
        "OVERDUE",
      ])
      .optional(),
  ),

  source: z.preprocess(
    emptyToUndefined,
    z
      .enum([
        "AUTO",
        "MANUAL",
      ])
      .optional(),
  ),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  pageSize: z.preprocess(
    emptyToUndefined,
    z.union([
      z.coerce
        .number()
        .int()
        .refine(
          (value) =>
            [10, 20, 50, 100].includes(value),
          "Page size tidak valid.",
        ),
      z.literal("all"),
    ]).default(20),
  ),

  sort: z.preprocess(
    emptyToUndefined,
    z
      .enum([
        "invoiceNumber",
        "customer",
        "invoiceDate",
        "dueDate",
        "total",
        "status",
      ])
      .default("invoiceDate"),
  ),

  order: z.preprocess(
    emptyToUndefined,
    z
      .enum([
        "asc",
        "desc",
      ])
      .default("desc"),
  ),
});

export type BillingListQuery =
  z.infer<typeof billingListQuerySchema>;