import { z } from "zod";

// ============================================================================
// Manual Invoice
// ============================================================================

export const createManualInvoiceSchema = z
  .object({
    customerId: z.coerce
      .number()
      .int()
      .positive("Customer wajib dipilih."),
    description: z
      .string()
      .trim()
      .min(1, "Deskripsi wajib diisi.")
      .max(500, "Deskripsi maksimal 500 karakter."),
    amount: z.coerce
      .number()
      .positive("Nominal harus lebih dari 0."),
    invoiceDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal invoice tidak valid."),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal jatuh tempo tidak valid."),
    notes: z
      .string()
      .trim()
      .max(2000, "Catatan terlalu panjang.")
      .optional()
      .default(""),
  })
  .refine(
    (value) => value.dueDate >= value.invoiceDate,
    {
      message: "Jatuh tempo tidak boleh sebelum tanggal invoice.",
      path: ["dueDate"],
    },
  );

export type CreateManualInvoiceInput =
  z.infer<typeof createManualInvoiceSchema>;