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
import { oltPonPorts } from "./olts";

export type NetworkTopologyPortType =
  | "PON"
  | "INPUT"
  | "OUTPUT"
  | "ETHERNET"
  | "UPLINK"
  | "DOWNLINK"
  | "SERVICE"
  | "OTHER";

export type NetworkTopologyPortStatus =
  | "AVAILABLE"
  | "USED"
  | "RESERVED"
  | "DAMAGED"
  | "DISABLED";

/*
 * =========================
 * NETWORK TOPOLOGY PORTS
 * =========================
 * Endpoint fisik seluruh node topology.
 */
export const networkTopologyPorts = pgTable(
  "network_topology_ports",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    nodeId: integer("node_id")
      .notNull()
      .references(() => networkTopologyNodes.id, {
        onDelete: "cascade",
      }),

    /*
     * Hanya untuk node OLT.
     * NULL untuk ODC, ODP, router, customer, dll.
     */
    oltPonPortId: integer("olt_pon_port_id")
      .references(() => oltPonPorts.id, {
        onDelete: "restrict",
      }),

    portNumber: integer("port_number").notNull(),

    name: varchar("name", { length: 100 }).notNull(),

    portType: varchar("port_type", { length: 30 })
      .$type<NetworkTopologyPortType>()
      .notNull(),

    status: varchar("status", { length: 30 })
      .$type<NetworkTopologyPortStatus>()
      .default("AVAILABLE")
      .notNull(),

    connectorType: varchar("connector_type", { length: 50 }),

    /*
     * Optical power aktual pada port.
     */
    measuredPowerDbm: numeric("measured_power_dbm", {
      precision: 6,
      scale: 2,
    }),

    /*
     * Loss per output.
     * Dapat dipakai untuk ratio maupun percentage.
     */
    configuredLossDb: numeric("configured_loss_db", {
      precision: 6,
      scale: 2,
    }),

    actualLossDb: numeric("actual_loss_db", {
      precision: 6,
      scale: 2,
    }),

    /*
     * Hanya digunakan jika device memakai
     * splitterType = PERCENTAGE.
     *
     * Contoh:
     * OUTPUT-01 = "10.00"
     * OUTPUT-02 = "90.00"
     */
    splitPercentage: numeric("split_percentage", {
      precision: 5,
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
    uniqueIndex("network_topology_ports_node_number_uidx")
      .on(table.nodeId, table.portNumber),

    uniqueIndex("network_topology_ports_olt_pon_uidx")
      .on(table.oltPonPortId),

    index("network_topology_ports_node_idx")
      .on(table.nodeId),

    index("network_topology_ports_status_idx")
      .on(table.status),

    index("network_topology_ports_type_idx")
      .on(table.portType),
  ],
);

export type NetworkTopologyPort =
  typeof networkTopologyPorts.$inferSelect;

export type NewNetworkTopologyPort =
  typeof networkTopologyPorts.$inferInsert;