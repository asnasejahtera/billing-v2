import { z } from "zod";

// ============================================================================
// Invoice Installment Export
// ============================================================================

export const invoiceInstallmentExportSchema = z.object({
  month: z.string().regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    "Bulan tidak valid.",
  ),
});

export type InvoiceInstallmentExportInput =
  z.infer<typeof invoiceInstallmentExportSchema>;