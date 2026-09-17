import { z } from "zod";

// ============================================================================
// Generate Invoice Validation
// ============================================================================

export const generateInvoicesSchema = z.object({
  billingPeriod: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$/,
      "Periode billing tidak valid.",
    ),
  invoiceDay: z.coerce
    .number()
    .int()
    .min(1, "Tanggal invoice minimal 1.")
    .max(31, "Tanggal invoice maksimal 31."),
  dueDay: z.coerce
    .number()
    .int()
    .min(1, "Tanggal jatuh tempo minimal 1.")
    .max(31, "Tanggal jatuh tempo maksimal 31."),
});

export type GenerateInvoicesInput =
  z.infer<typeof generateInvoicesSchema>;