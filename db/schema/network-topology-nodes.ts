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
import { customers } from "./cusotmers";
import { fiberDistributionDevices } from "./fiber-distribution-devices";
import { olts } from "./olts";
import { routers } from "./routers";

/*
 * =========================
 * NETWORK TOPOLOGY NODES
 * =========================
 * Representasi semua titik fisik pada map.
 *
 * node_type disimpan sebagai string:
 * ROUTER | OLT | ODC | ODP | CUSTOMER | POLE
 *
 * Data detail perangkat tetap berada pada
 * tabel sumber masing-masing.
 */
export type NetworkTopologyNodeType =
  | "ROUTER"
  | "OLT"
  | "ODC"
  | "ODP"
  | "CUSTOMER"
  | "POLE";

export const networkTopologyNodes = pgTable(
  "network_topology_nodes",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),

    /*
     * Gunakan string, bukan PostgreSQL enum.
     * Validasi node type dilakukan pada service.
     */
    nodeType: varchar("node_type", { length: 30 }).$type<NetworkTopologyNodeType>().notNull(),

    /*
     * numeric PostgreSQL tetap berupa string
     * pada persistence layer.
     */
    latitude: numeric("latitude", {
      precision: 10,
      scale: 7,
    }).notNull(),

    longitude: numeric("longitude", {
      precision: 10,
      scale: 7,
    }).notNull(),

    /*
     * =========================
     * DEVICE REFERENCES
     * =========================
     * Hanya salah satu FK yang normalnya terisi
     * sesuai node_type.
     */
    routerId: integer("router_id")
      .references(() => routers.id, {
        onDelete: "restrict",
      }),

    oltId: integer("olt_id")
      .references(() => olts.id, {
        onDelete: "restrict",
      }),

    distributionDeviceId: integer("distribution_device_id")
      .references(() => fiberDistributionDevices.id, {
        onDelete: "restrict",
      }),

    customerId: integer("customer_id")
      .references(() => customers.id, {
        onDelete: "restrict",
      }),

    /*
     * Status topology, bukan status koneksi
     * MikroTik/OLT/customer.
     */
    status: varchar("status", { length: 30 })
      .default("ACTIVE")
      .notNull(),

    address: text("address"),
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
    uniqueIndex("network_topology_nodes_code_uidx")
      .on(table.code),

    /*
     * Satu perangkat fisik hanya mempunyai
     * satu node topology.
     *
     * PostgreSQL tetap mengizinkan banyak NULL
     * pada unique index.
     */
    uniqueIndex("network_topology_nodes_router_uidx")
      .on(table.routerId),

    uniqueIndex("network_topology_nodes_olt_uidx")
      .on(table.oltId),

    uniqueIndex("network_topology_nodes_distribution_uidx")
      .on(table.distributionDeviceId),

    uniqueIndex("network_topology_nodes_customer_uidx")
      .on(table.customerId),

    index("network_topology_nodes_type_idx")
      .on(table.nodeType),

    index("network_topology_nodes_status_idx")
      .on(table.status),
  ],
);

export type NetworkTopologyNode =
  typeof networkTopologyNodes.$inferSelect;

export type NewNetworkTopologyNode =
  typeof networkTopologyNodes.$inferInsert;