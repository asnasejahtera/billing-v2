import { z } from "zod";

/**
 * ============================================
 * SEND CUSTOMER MESSAGE
 * ============================================
 */
export const sendCustomerMessageSchema = z.object({
  customerIds: z
    .array(z.number().int().positive())
    .min(1, "Pilih minimal satu customer.")
    .max(2000, "Maksimal 2000 customer."),
  body: z
    .string()
    .trim()
    .min(1, "Pesan wajib diisi.")
    .max(5000),
  minDelaySec: z.number().int().min(1).max(300),
  maxDelaySec: z.number().int().min(1).max(300),
}).refine(
  (data) => data.maxDelaySec >= data.minDelaySec,
  {
    path: ["maxDelaySec"],
    message: "Delay maksimum harus lebih besar atau sama dengan minimum.",
  },
);

/**
 * ============================================
 * DELIVERY STATUS
 * ============================================
 */
export const customerMessageStatusSchema = z.object({
  messageIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(2000),
});

export type SendCustomerMessageInput =
  z.infer<typeof sendCustomerMessageSchema>;