import { z } from "zod";

/**
 * ============================================
 * TEMPLATE CATEGORIES
 * ============================================
 */
export const whatsappTemplateCategories = [
  "BILLING",
  "PAYMENT",
  "CUSTOMER",
  "OUTAGE",
  "SYSTEM",
] as const;

/**
 * ============================================
 * EMPTY TIPTAP DOCUMENT
 * ============================================
 */
export const EMPTY_WHATSAPP_TEMPLATE_CONTENT: Record<string, unknown> = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

/**
 * ============================================
 * VARIABLE
 * ============================================
 */
export const whatsappTemplateVariableSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key variable wajib diisi.")
    .max(100)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Key variable harus lowercase snake_case, contoh customer_name.",
    ),

  label: z
    .string()
    .trim()
    .min(1, "Label variable wajib diisi.")
    .max(150),

  example: z
    .string()
    .trim()
    .max(255)
    .optional()
    .default(""),
});

/**
 * ============================================
 * RICH TEXT
 * ============================================
 */
const richTextContentSchema = z
  .record(
    z.string(),
    z.unknown(),
  )
  .refine(
    (value) =>
      JSON.stringify(value).length <=
      100_000,
    "Struktur rich text terlalu besar.",
  );

/**
 * ============================================
 * SHARED FIELDS
 * ============================================
 */
const templateFields = {
  name: z
    .string()
    .trim()
    .min(3, "Nama template minimal 3 karakter.")
    .max(150),

  category: z.enum(
    whatsappTemplateCategories,
  ),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .default(""),

  body: z
    .string()
    .trim()
    .min(1, "Isi pesan wajib diisi.")
    .max(5000),

  contentJson: richTextContentSchema
    .optional()
    .default(
      EMPTY_WHATSAPP_TEMPLATE_CONTENT,
    ),

  variables: z
    .array(
      whatsappTemplateVariableSchema,
    )
    .max(
      30,
      "Maksimal 30 variable.",
    )
    .default([]),
};

/**
 * ============================================
 * CREATE
 * ============================================
 */
export const createWhatsAppTemplateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(3, "Key template minimal 3 karakter.")
    .max(100)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Key harus lowercase snake_case, contoh invoice_created.",
    ),

  ...templateFields,
});

/**
 * ============================================
 * UPDATE
 * ============================================
 */
export const updateWhatsAppTemplateSchema = z.object({
  id: z
    .number()
    .int()
    .positive(),

  ...templateFields,
});

export type CreateWhatsAppTemplateInput =
  z.infer<
    typeof createWhatsAppTemplateSchema
  >;

export type UpdateWhatsAppTemplateInput =
  z.infer<
    typeof updateWhatsAppTemplateSchema
  >;