import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * ============================================
 * TEMPLATE VARIABLE
 * ============================================
 */
export type WhatsAppTemplateVariable = {
  key: string;
  label: string;
  example?: string;
};

/**
 * ============================================
 * WHATSAPP MESSAGE TEMPLATE
 * ============================================
 */
export const whatsappMessageTemplates = pgTable(
  "whatsapp_message_templates",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    key: varchar("key", {
      length: 100,
    }).notNull(),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    category: varchar("category", {
      length: 50,
    }).notNull(),

    description: text("description"),

    /**
     * Final text yang dikirim ke WhatsApp.
     */
    body: text("body").notNull(),

    /**
     * Struktur Tiptap untuk editor.
     */
    contentJson: jsonb("content_json")
      .$type<Record<string, unknown> | null>(),

    variables: jsonb("variables")
      .$type<WhatsAppTemplateVariable[]>()
      .notNull()
      .default([]),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "whatsapp_message_templates_key_unique",
    ).on(table.key),

    index(
      "whatsapp_message_templates_category_idx",
    ).on(table.category),

    index(
      "whatsapp_message_templates_active_idx",
    ).on(table.isActive),
  ],
);

export type WhatsAppMessageTemplate =
  typeof whatsappMessageTemplates.$inferSelect;

export type NewWhatsAppMessageTemplate =
  typeof whatsappMessageTemplates.$inferInsert;