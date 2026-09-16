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
 * COMMAND TYPE
 * ============================================
 */
export const whatsappConnectionCommandTypeEnum =
  pgEnum(
    "whatsapp_connection_command_type",
    [
      "LOGOUT",
      "RECONNECT",
    ],
  );

/**
 * ============================================
 * COMMAND STATUS
 * ============================================
 */
export const whatsappConnectionCommandStatusEnum =
  pgEnum(
    "whatsapp_connection_command_status",
    [
      "PENDING",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
    ],
  );

/**
 * ============================================
 * CONNECTION COMMANDS
 * ============================================
 *
 * Vercel menulis command.
 * whatsappjs-client memproses command.
 */
export const whatsappConnectionCommands =
  pgTable(
    "whatsapp_connection_commands",
    {
      id: integer("id")
        .primaryKey()
        .generatedAlwaysAsIdentity(),

      clientKey: varchar(
        "client_key",
        { length: 50 },
      )
        .notNull()
        .default("default"),

      command:
        whatsappConnectionCommandTypeEnum(
          "command",
        )
          .notNull(),

      status:
        whatsappConnectionCommandStatusEnum(
          "status",
        )
          .notNull()
          .default("PENDING"),

      error: text("error"),

      requestedAt: timestamp(
        "requested_at",
        { withTimezone: true },
      )
        .notNull()
        .defaultNow(),

      processingAt: timestamp(
        "processing_at",
        { withTimezone: true },
      ),

      completedAt: timestamp(
        "completed_at",
        { withTimezone: true },
      ),

      createdAt: timestamp(
        "created_at",
        { withTimezone: true },
      )
        .notNull()
        .defaultNow(),

      updatedAt: timestamp(
        "updated_at",
        { withTimezone: true },
      )
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index(
        "whatsapp_commands_pending_idx",
      ).on(
        table.clientKey,
        table.status,
      ),

      index(
        "whatsapp_commands_requested_idx",
      ).on(
        table.requestedAt,
      ),
    ],
  );

export type WhatsAppConnectionCommand =
  typeof whatsappConnectionCommands.$inferSelect;

export type WhatsAppConnectionCommandType =
  (
    typeof whatsappConnectionCommandTypeEnum.enumValues
  )[number];