import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export type FiberDistributionDeviceType = "ODC" | "ODP";
export type FiberSplitterType = "NONE" | "RATIO" | "PERCENTAGE";

/*
 * =========================
 * FIBER DISTRIBUTION DEVICES
 * =========================
 * ODC dan ODP menggunakan satu tabel.
 * Satu perangkat memiliki satu konfigurasi
 * splitter utama.
 */
export const fiberDistributionDevices = pgTable(
  "fiber_distribution_devices",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 150 }).notNull(),
    deviceType: varchar("device_type", { length: 10 })
      .$type<FiberDistributionDeviceType>()
      .notNull(),

    /*
     * Kapasitas OUTPUT.
     * INPUT tidak dihitung sebagai port capacity.
     */
    portCapacity: integer("port_capacity").notNull(),

    /*
     * NONE       = tidak memakai splitter
     * RATIO      = 1:2, 1:4, 1:8, dst.
     * PERCENTAGE = persentase disimpan per OUTPUT port.
     */
    splitterType: varchar("splitter_type", { length: 20 })
      .$type<FiberSplitterType>()
      .default("NONE")
      .notNull(),

    /*
     * Digunakan jika splitterType = RATIO.
     * Contoh: 1:2, 1:4, 1:8, 1:16, 1:32, 1:64.
     */
    splitterRatio: varchar("splitter_ratio", { length: 20 }),

    /*
     * Optical power masuk perangkat.
     * Nullable karena belum tentu diukur.
     */
    inputPowerDbm: numeric("input_power_dbm", {
      precision: 6,
      scale: 2,
    }),

    description: text("description"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("fiber_distribution_devices_type_name_uidx")
      .on(table.deviceType, table.name),
  ],
);

export type FiberDistributionDevice =
  typeof fiberDistributionDevices.$inferSelect;

export type NewFiberDistributionDevice =
  typeof fiberDistributionDevices.$inferInsert;