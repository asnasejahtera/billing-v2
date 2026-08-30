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

    code: varchar("code", {
      length: 50,
    }).notNull(),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    nodeType: varchar("node_type", {
      length: 20,
    })
      .$type<NetworkTopologyNodeType>()
      .notNull(),

    latitude: numeric("latitude", {
      precision: 10,
      scale: 7,
    }).notNull(),

    longitude: numeric("longitude", {
      precision: 10,
      scale: 7,
    }).notNull(),

    address: text("address"),
    description: text("description"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex(
      "network_topology_nodes_code_uidx",
    ).on(table.code),

    index(
      "network_topology_nodes_type_idx",
    ).on(table.nodeType),
  ],
);