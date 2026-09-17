import { z } from "zod";

// ============================================================================
// Send Selected Overdue Invoice WhatsApp
// ============================================================================

export const sendOverdueInvoicesWhatsAppSchema = z
  .object({
    invoiceIds: z
      .array(z.coerce.number().int().positive())
      .min(1, "Pilih minimal satu invoice."),

    messageMode: z.enum([
      "TEMPLATE",
      "MANUAL",
    ]),

    templateId: z
      .string()
      .optional(),

    manualMessage: z
      .string()
      .trim()
      .max(
        5000,
        "Pesan maksimal 5000 karakter.",
      )
      .optional(),

    // ========================================================================
    // Random Delay
    // ========================================================================

    delayMinSeconds: z.coerce
      .number()
      .int()
      .min(1, "Jeda minimum minimal 1 detik.")
      .max(3600)
      .default(5),

    delayMaxSeconds: z.coerce
      .number()
      .int()
      .min(1, "Jeda maksimum minimal 1 detik.")
      .max(3600)
      .default(15),
  })
  .superRefine((value, ctx) => {
    if (
      value.messageMode === "TEMPLATE" &&
      !value.templateId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["templateId"],
        message: "Pilih template pesan.",
      });
    }

    if (
      value.messageMode === "MANUAL" &&
      !value.manualMessage?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["manualMessage"],
        message: "Pesan manual wajib diisi.",
      });
    }

    // ========================================================================
    // Validate Delay Range
    // ========================================================================

    if (
      value.delayMaxSeconds <
      value.delayMinSeconds
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["delayMaxSeconds"],
        message:
          "Jeda maksimum tidak boleh lebih kecil dari minimum.",
      });
    }
  });

export type SendOverdueInvoicesWhatsAppInput =
  z.infer<
    typeof sendOverdueInvoicesWhatsAppSchema
  >;

// ============================================================================
// Realtime WhatsApp Progress
// ============================================================================

export const overdueWhatsAppProgressSchema =
  z.object({
    messageIds: z
      .array(
        z.coerce
          .number()
          .int()
          .positive(),
      )
      .min(1)
      .max(500),
  });