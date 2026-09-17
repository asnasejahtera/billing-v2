import { z } from "zod";

// ============================================================================
// Billing Export
// ============================================================================

export const billingExportSchema = z.object({
  months: z
    .array(
      z.string().regex(
        /^\d{4}-(0[1-9]|1[0-2])$/,
        "Format bulan tidak valid.",
      ),
    )
    .min(1, "Pilih minimal satu bulan.")
    .max(24, "Maksimal 24 bulan."),
});

export type BillingExportInput =
  z.infer<typeof billingExportSchema>;