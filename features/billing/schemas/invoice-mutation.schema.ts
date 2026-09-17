import { z } from "zod";

// ============================================================================
// Edit Invoice
// ============================================================================

export const editInvoiceSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    description: z.string().trim().min(1, "Deskripsi wajib diisi.").max(500),
    amount: z.coerce.number().positive("Nominal harus lebih dari 0."),
    invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal invoice tidak valid."),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal jatuh tempo tidak valid."),
    notes: z.string().trim().max(2000).optional().default(""),
  })
  .refine((value) => value.dueDate >= value.invoiceDate, {
    message: "Jatuh tempo tidak boleh sebelum tanggal invoice.",
    path: ["dueDate"],
  });

export type EditInvoiceInput = z.infer<typeof editInvoiceSchema>;

// ============================================================================
// Delete / VOID Invoice
// ============================================================================

export const deleteInvoiceSchema = z.object({
  id: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3, "Alasan penghapusan minimal 3 karakter.").max(500),
});

export type DeleteInvoiceInput = z.infer<typeof deleteInvoiceSchema>;