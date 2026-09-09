import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { fiberCableCores } from "./fiber-cables";
import { networkTopologyPorts } from "./network-topology-ports";

export type FiberCoreConnectionStatus =
  | "ACTIVE"
  | "RELEASED";

/*
 * =========================
 * FIBER CORE CONNECTIONS
 * =========================
 * Menyimpan penggunaan satu core fiber:
 *
 * Core BLUE
 * ODC-01 OUTPUT-03
 *       ↓
 * ODP-02 INPUT-01
 *
 * History koneksi tetap disimpan menggunakan
 * status RELEASED.
 */
export const fiberCoreConnections = pgTable(
  "fiber_core_connections",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    /*
     * Core fisik yang digunakan.
     */
    coreId: integer("core_id")
      .notNull()
      .references(() => fiberCableCores.id, {
        onDelete: "cascade",
      }),

    /*
     * Port pada node sumber kabel.
     */
    sourcePortId: integer("source_port_id")
      .notNull()
      .references(() => networkTopologyPorts.id, {
        onDelete: "restrict",
      }),

    /*
     * Port pada node tujuan kabel.
     */
    targetPortId: integer("target_port_id")
      .notNull()
      .references(() => networkTopologyPorts.id, {
        onDelete: "restrict",
      }),

    status: varchar("status", { length: 30 })
      .$type<FiberCoreConnectionStatus>()
      .default("ACTIVE")
      .notNull(),

    description: text("description"),

    connectedAt: timestamp("connected_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    releasedAt: timestamp("released_at", {
      withTimezone: true,
    }),

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
    index("fiber_core_connections_core_idx")
      .on(table.coreId),

    index("fiber_core_connections_source_port_idx")
      .on(table.sourcePortId),

    index("fiber_core_connections_target_port_idx")
      .on(table.targetPortId),

    index("fiber_core_connections_status_idx")
      .on(table.status),

    /*
     * Satu core hanya boleh mempunyai
     * satu koneksi ACTIVE.
     *
     * Koneksi RELEASED boleh berjumlah banyak
     * sehingga history tetap tersimpan.
     */
    uniqueIndex("fiber_core_connections_active_core_uidx")
      .on(table.coreId)
      .where(sql`${table.status} = 'ACTIVE'`),

    /*
     * Satu source port hanya boleh digunakan
     * satu koneksi aktif.
     */
    uniqueIndex("fiber_core_connections_active_source_port_uidx")
      .on(table.sourcePortId)
      .where(sql`${table.status} = 'ACTIVE'`),

    /*
     * Satu target port hanya boleh digunakan
     * satu koneksi aktif.
     */
    uniqueIndex("fiber_core_connections_active_target_port_uidx")
      .on(table.targetPortId)
      .where(sql`${table.status} = 'ACTIVE'`),
  ],
);

export type FiberCoreConnection =
  typeof fiberCoreConnections.$inferSelect;

export type NewFiberCoreConnection =
  typeof fiberCoreConnections.$inferInsert;