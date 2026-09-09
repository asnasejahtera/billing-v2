import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/*
 * =========================
 * OLTS
 * =========================
 * Data perangkat OLT sekaligus konfigurasi
 * yang digunakan modul integrasi OLT.
 */
export const olts = pgTable(
  "olts",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    name: varchar("name", { length: 150 }).notNull(),

    /* Optional device information. */
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),

    /* Jumlah physical PON port pada OLT. */
    ponCount: integer("pon_count").notNull(),

    /*
     * Konfigurasi integrasi.
     * Contoh baseUrl:
     * http://192.168.1.10
     */
    baseUrl: varchar("base_url", { length: 255 }).notNull(),
    username: varchar("username", { length: 150 }).notNull(),

    /*
     * Jangan menyimpan password plain text.
     * Encrypt/decrypt dilakukan di service layer.
     */
    passwordEncrypted: text("password_encrypted").notNull(),

    isActive: boolean("is_active")
      .default(true)
      .notNull(),

    description: text("description"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("olts_name_uidx").on(table.name),
    index("olts_active_idx").on(table.isActive),
  ],
);

/*
 * =========================
 * OLT PON PORTS
 * =========================
 * Satu row mewakili satu physical PON port.
 *
 * Optical power nullable karena data pengukuran
 * belum tentu tersedia.
 */
export const oltPonPorts = pgTable(
  "olt_pon_ports",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    oltId: integer("olt_id")
      .notNull()
      .references(() => olts.id, {
        onDelete: "cascade",
      }),

    ponNumber: integer("pon_number").notNull(),

    name: varchar("name", { length: 100 }),

    /*
     * Output optical power per PON.
     * Numeric disimpan sebagai string di persistence.
     *
     * Contoh:
     * "4.10"
     * "3.85"
     */
    txPowerDbm: numeric("tx_power_dbm", {
      precision: 6,
      scale: 2,
    }),

    description: text("description"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("olt_pon_ports_olt_number_uidx")
      .on(table.oltId, table.ponNumber),

    index("olt_pon_ports_olt_idx")
      .on(table.oltId),
  ],
);

export type Olt = typeof olts.$inferSelect;
export type NewOlt = typeof olts.$inferInsert;

export type OltPonPort =
  typeof oltPonPorts.$inferSelect;

export type NewOltPonPort =
  typeof oltPonPorts.$inferInsert;