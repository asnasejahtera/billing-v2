import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * ============================================
 * WHATSAPP CONNECTION STATUS
 * ============================================
 *
 * STARTING      = worker sedang initialize.
 * QR_REQUIRED   = membutuhkan scan QR.
 * AUTHENTICATED = login berhasil, belum READY.
 * READY         = client siap kirim pesan.
 * DISCONNECTED  = client tidak terhubung.
 * ERROR         = terjadi error pada worker/client.
 */
export const whatsappConnectionStatusEnum = pgEnum(
  "whatsapp_connection_status",
  [
    "DISCONNECTED",
    "STARTING",
    "QR_REQUIRED",
    "AUTHENTICATED",
    "READY",
    "ERROR",
  ],
);

/**
 * ============================================
 * WHATSAPP CONNECTIONS
 * ============================================
 *
 * Database hanya menyimpan metadata/status.
 *
 * LocalAuth/session WhatsApp TIDAK disimpan di sini.
 * Session tetap berada di filesystem whatsappjs-client.
 */
export const whatsappConnections = pgTable(
  "whatsapp_connections",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    /**
     * Identifier logical client.
     *
     * Tahap awal:
     * default
     *
     * Nantinya memungkinkan multi WhatsApp client.
     */
    clientKey: varchar("client_key", {
      length: 50,
    })
      .notNull()
      .default("default"),

    /**
     * Harus cocok dengan WHATSAPP_CLIENT_ID
     * di repository whatsappjs-client.
     */
    sessionName: varchar("session_name", {
      length: 100,
    })
      .notNull()
      .default("billing-main"),

    status: whatsappConnectionStatusEnum("status")
      .notNull()
      .default("DISCONNECTED"),

    /**
     * Nomor WhatsApp yang sedang login.
     *
     * Contoh:
     * 628123456789
     */
    phoneNumber: varchar("phone_number", {
      length: 30,
    }),

    /**
     * Pushname/profile name WhatsApp.
     */
    displayName: varchar("display_name", {
      length: 150,
    }),

    /**
     * ID instance worker.
     *
     * Berguna jika nantinya worker berpindah VPS
     * atau ada lebih dari satu worker.
     */
    workerInstance: varchar("worker_instance", {
      length: 100,
    }),

    /**
     * Error terakhir dari whatsappjs-client.
     *
     * Jangan simpan token/session/cookie di sini.
     */
    lastError: text("last_error"),

    /**
     * ============================================
     * TEMPORARY QR
     * ============================================
     *
     * QR bersifat sementara dan otomatis diganti oleh
     * event QR berikutnya. Ini BUKAN LocalAuth/session.
     */
    qrCode: text("qr_code"),

    qrGeneratedAt: timestamp(
      "qr_generated_at",
      { withTimezone: true },
    ),

    qrExpiresAt: timestamp(
      "qr_expires_at",
      { withTimezone: true },
    ),

    /**
     * Heartbeat terakhir worker.
     *
     * Nantinya dashboard dapat membedakan:
     *
     * READY + heartbeat baru   = worker hidup
     * READY + heartbeat lama   = worker kemungkinan mati
     */
    lastHeartbeatAt: timestamp(
      "last_heartbeat_at",
      { withTimezone: true },
    ),

    lastReadyAt: timestamp(
      "last_ready_at",
      { withTimezone: true },
    ),

    lastDisconnectedAt: timestamp(
      "last_disconnected_at",
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
    uniqueIndex(
      "whatsapp_connections_client_key_unique",
    ).on(table.clientKey),

    index(
      "whatsapp_connections_status_idx",
    ).on(table.status),

    index(
      "whatsapp_connections_heartbeat_idx",
    ).on(table.lastHeartbeatAt),
  ],
);

/**
 * ============================================
 * TYPES
 * ============================================
 */
export type WhatsAppConnection =
  typeof whatsappConnections.$inferSelect;

export type NewWhatsAppConnection =
  typeof whatsappConnections.$inferInsert;

export type WhatsAppConnectionStatus =
  (typeof whatsappConnectionStatusEnum.enumValues)[number];