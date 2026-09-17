import { z } from "zod";

// ============================================================================
// Create Payment
// ============================================================================

export const createPaymentSchema = z.object({
  invoiceId: z.coerce
    .number()
    .int()
    .positive(),

  amount: z.coerce
    .number()
    .positive(
      "Jumlah pembayaran harus lebih dari 0.",
    ),

  paymentDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Tanggal pembayaran tidak valid.",
    ),

  method: z.enum([
    "CASH",
    "TRANSFER",
    "QRIS",
    "EWALLET",
    "OTHER",
  ]),

  referenceNumber: z
    .string()
    .trim()
    .max(150)
    .optional()
    .default(""),

  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default(""),
});

export type CreatePaymentInput =
  z.infer<typeof createPaymentSchema>;

// ============================================================================
// Customer Outstanding Invoice Query
// ============================================================================

const emptyToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

export const customerPaymentInvoicesSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  period: z.preprocess(
    emptyToUndefined,
    z.string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
  ),
});

export type CustomerPaymentInvoicesInput =
  z.infer<typeof customerPaymentInvoicesSchema>;

// ============================================================================
// Payment History Query
// ============================================================================

export const paymentHistorySchema = z.object({
  customerId: z.coerce.number().int().positive(),
  period: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
  ),
});

export type PaymentHistoryInput =
  z.infer<typeof paymentHistorySchema>;

// ============================================================================
// Edit Payment
// ============================================================================

export const editPaymentSchema = z.object({
  id: z.coerce.number().int().positive(),
  amount: z.coerce
    .number()
    .positive("Jumlah pembayaran harus lebih dari 0."),
  paymentDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal pembayaran tidak valid."),
  method: z.enum([
    "CASH",
    "TRANSFER",
    "QRIS",
    "EWALLET",
    "OTHER",
  ]),
  referenceNumber: z.string().trim().max(150).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type EditPaymentInput =
  z.infer<typeof editPaymentSchema>;

// ============================================================================
// Delete Payment
// ============================================================================

export const deletePaymentSchema =
  z.object({
    id: z.coerce
      .number()
      .int()
      .positive(),
  });

export type DeletePaymentInput =
  z.infer<
    typeof deletePaymentSchema
  >;

