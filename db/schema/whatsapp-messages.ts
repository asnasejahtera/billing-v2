import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * ============================================
 * MESSAGE STATUS
 * ============================================
 */
export const whatsappMessageStatusEnum = pgEnum(
  "whatsapp_message_status",
  [
    "PENDING",
    "PROCESSING",
    "SENT",
    "FAILED",
    "CANCELLED",
  ],
);

/**
 * ============================================
 * MESSAGE SOURCE
 * ============================================
 *
 * TEST sekarang.
 * Source lainnya dipakai tahap berikutnya.
 */
export const whatsappMessageSourceEnum = pgEnum(
  "whatsapp_message_source",
  [
    "TEST",
    "MANUAL",
    "CUSTOMER",
    "INVOICE",
    "PAYMENT",
    "OVERDUE",
    "SUSPENSION",
    "OUTAGE",
    "SYSTEM",
  ],
);

/**
 * ============================================
 * WHATSAPP MESSAGES
 * ============================================
 */
export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    clientKey: varchar("client_key", {
      length: 50,
    })
      .notNull()
      .default("default"),

    source: whatsappMessageSourceEnum("source")
      .notNull()
      .default("MANUAL"),

    status: whatsappMessageStatusEnum("status")
      .notNull()
      .default("PENDING"),

    /**
     * Nomor dalam format internasional tanpa +.
     * Contoh: 628123456789.
     */
    recipientPhone: varchar("recipient_phone", {
      length: 30,
    }).notNull(),

    recipientName: varchar("recipient_name", {
      length: 150,
    }),

    /**
     * WA ID hasil getNumberId().
     * Contoh: 628xxx@c.us
     */
    recipientWaId: varchar("recipient_wa_id", {
      length: 150,
    }),

    body: text("body").notNull(),

    /**
     * whatsapp-web.js Message ID.
     */
    whatsappMessageId: varchar(
      "whatsapp_message_id",
      { length: 255 },
    ),

    error: text("error"),

    attempts: integer("attempts")
      .notNull()
      .default(0),

    maxAttempts: integer("max_attempts")
      .notNull()
      .default(3),

    availableAt: timestamp("available_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    processingAt: timestamp("processing_at", {
      withTimezone: true,
    }),

    sentAt: timestamp("sent_at", {
      withTimezone: true,
    }),

    failedAt: timestamp("failed_at", {
      withTimezone: true,
    }),

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
    index(
      "whatsapp_messages_queue_idx",
    ).on(
      table.clientKey,
      table.status,
      table.availableAt,
    ),

    index(
      "whatsapp_messages_phone_idx",
    ).on(table.recipientPhone),

    index(
      "whatsapp_messages_created_idx",
    ).on(table.createdAt),
  ],
);

export type WhatsAppMessage =
  typeof whatsappMessages.$inferSelect;

export type WhatsAppMessageStatus =
  (typeof whatsappMessageStatusEnum.enumValues)[number];