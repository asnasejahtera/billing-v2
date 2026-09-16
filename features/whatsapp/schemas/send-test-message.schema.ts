import { z } from "zod";

/**
 * ============================================
 * TEST MESSAGE VALIDATION
 * ============================================
 */
export const sendWhatsAppTestMessageSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, "Nomor WhatsApp terlalu pendek.")
    .max(30, "Nomor WhatsApp terlalu panjang."),

  body: z
    .string()
    .trim()
    .min(1, "Pesan wajib diisi.")
    .max(4000, "Pesan maksimal 4000 karakter."),

  /**
   * ISO string dari browser.
   *
   * Contoh:
   * 2026-09-16T07:00:00.000Z
   */
  scheduledAt: z
    .string()
    .datetime()
    .nullable()
    .optional(),
});

export type SendWhatsAppTestMessageInput =
  z.infer<
    typeof sendWhatsAppTestMessageSchema
  >;