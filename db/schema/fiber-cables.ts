import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { networkTopologyNodes } from "./network-topology-nodes";

export type FiberCableStatus =
  | "ACTIVE"
  | "RESERVED"
  | "DAMAGED"
  | "INACTIVE";

export type FiberCableCoreStatus =
  | "AVAILABLE"
  | "USED"
  | "RESERVED"
  | "DAMAGED";

/*
 * =========================
 * FIBER CABLES
 * =========================
 * Satu row = satu kabel fisik.
 *
 * Contoh:
 * Kabel ODC-01 → ODP-02, 2 core.
 */
export const fiberCables = pgTable(
  "fiber_cables",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 150 }).notNull(),

    /*
     * Contoh:
     * DROP_CABLE
     * ADSS
     * DUCT
     * OTHER
     *
     * String agar tidak terkunci PostgreSQL enum.
     */
    cableType: varchar("cable_type", { length: 50 }),

    /*
     * Contoh:
     * G652D
     * G657A1
     * G657A2
     */
    fiberType: varchar("fiber_type", { length: 50 }),

    coreCount: integer("core_count").notNull(),

    /*
     * Endpoint fisik kabel.
     * Port yang dipakai per core disimpan nanti
     * di fiber_core_connections.
     */
    sourceNodeId: integer("source_node_id")
      .notNull()
      .references(() => networkTopologyNodes.id, {
        onDelete: "restrict",
      }),

    targetNodeId: integer("target_node_id")
      .notNull()
      .references(() => networkTopologyNodes.id, {
        onDelete: "restrict",
      }),

    estimatedLengthMeters: numeric("estimated_length_meters", {
      precision: 12,
      scale: 2,
    }),

    actualLengthMeters: numeric("actual_length_meters", {
      precision: 12,
      scale: 2,
    }),

    /*
     * Attenuation default kabel per km.
     * PostgreSQL numeric tetap string
     * pada persistence layer.
     */
    attenuationDbPerKm: numeric("attenuation_db_per_km", {
      precision: 6,
      scale: 3,
    }),

    status: varchar("status", { length: 30 })
      .$type<FiberCableStatus>()
      .default("ACTIVE")
      .notNull(),

    description: text("description"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("fiber_cables_name_uidx")
      .on(table.name),

    index("fiber_cables_source_node_idx")
      .on(table.sourceNodeId),

    index("fiber_cables_target_node_idx")
      .on(table.targetNodeId),

    index("fiber_cables_status_idx")
      .on(table.status),
  ],
);

/*
 * =========================
 * FIBER CABLE CORES
 * =========================
 * Satu row = satu core nyata dalam kabel.
 *
 * Core tidak dianggap USED hanya berdasarkan
 * angka core_count. Status mengikuti koneksi core.
 */
export const fiberCableCores = pgTable(
  "fiber_cable_cores",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    cableId: integer("cable_id")
      .notNull()
      .references(() => fiberCables.id, {
        onDelete: "cascade",
      }),

    coreNumber: integer("core_number").notNull(),

    /*
     * Contoh:
     * BLUE
     * ORANGE
     * GREEN
     * BROWN
     *
     * String supaya tetap fleksibel.
     */
    color: varchar("color", { length: 50 }).notNull(),

    status: varchar("status", { length: 30 })
      .$type<FiberCableCoreStatus>()
      .default("AVAILABLE")
      .notNull(),

    description: text("description"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /*
     * Dalam satu kabel tidak boleh ada
     * core number yang sama.
     */
    uniqueIndex("fiber_cable_cores_cable_number_uidx")
      .on(table.cableId, table.coreNumber),

    index("fiber_cable_cores_cable_idx")
      .on(table.cableId),

    index("fiber_cable_cores_status_idx")
      .on(table.status),
  ],
);

export type FiberCable =
  typeof fiberCables.$inferSelect;

export type NewFiberCable =
  typeof fiberCables.$inferInsert;

export type FiberCableCore =
  typeof fiberCableCores.$inferSelect;

export type NewFiberCableCore =
  typeof fiberCableCores.$inferInsert;