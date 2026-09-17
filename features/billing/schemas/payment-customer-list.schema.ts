import { z } from "zod";

// ============================================================================
// Helpers
// ============================================================================

const emptyToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

// ============================================================================
// Payment Customer List
// ============================================================================

export const paymentCustomerListSchema = z.object({
  q: z.string().trim().max(150).optional().default(""),
  period: z.preprocess(
    emptyToUndefined,
    z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Periode tidak valid.").optional(),
  ),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  ),
  debtStatus: z.preprocess(
    emptyToUndefined,
    z.enum(["OUTSTANDING", "OVERDUE"]).optional(),
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.preprocess(
    emptyToUndefined,
    z.union([
      z.coerce.number().int().refine(
        (value) => [10, 20, 50, 100].includes(value),
        "Page size tidak valid.",
      ),
      z.literal("all"),
    ]).default(20),
  ),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["name", "status", "outstanding", "overdue"]).default("name"),
  ),
  order: z.preprocess(
    emptyToUndefined,
    z.enum(["asc", "desc"]).default("asc"),
  ),
});

export type PaymentCustomerListQuery =
  z.infer<typeof paymentCustomerListSchema>;