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
import { fiberCables } from "./fiber-cables";

export type NetworkTopologyLinkStatus =
  | "ACTIVE"
  | "PLANNED"
  | "DAMAGED"
  | "INACTIVE";

/*
 * =========================
 * NETWORK TOPOLOGY LINKS
 * =========================
 * Representasi satu kabel fisik sebagai
 * satu jalur/polyline pada Google Maps.
 *
 * Source/target node tidak diduplikasi di sini.
 * Endpoint diambil dari fiber_cables.
 */
export const networkTopologyLinks = pgTable(
  "network_topology_links",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    /*
     * Satu kabel fisik hanya mempunyai
     * satu jalur utama di map.
     */
    fiberCableId: integer("fiber_cable_id")
      .notNull()
      .references(() => fiberCables.id, {
        onDelete: "cascade",
      }),

    /*
     * Panjang berdasarkan geometry/polyline map.
     * Berbeda dari actualLengthMeters yang berada
     * di fiber_cables.
     */
    routeLengthMeters: numeric("route_length_meters", {
      precision: 12,
      scale: 2,
    }),

    status: varchar("status", { length: 30 })
      .$type<NetworkTopologyLinkStatus>()
      .default("ACTIVE")
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
    uniqueIndex("network_topology_links_cable_uidx")
      .on(table.fiberCableId),

    index("network_topology_links_status_idx")
      .on(table.status),
  ],
);

/*
 * =========================
 * LINK WAYPOINTS
 * =========================
 * Titik-titik tambahan di antara source
 * dan target kabel.
 *
 * Source dan target tidak disimpan sebagai
 * waypoint karena koordinatnya berasal dari node.
 */
export const networkTopologyLinkWaypoints = pgTable(
  "network_topology_link_waypoints",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    linkId: integer("link_id")
      .notNull()
      .references(() => networkTopologyLinks.id, {
        onDelete: "cascade",
      }),

    /*
     * Urutan waypoint:
     * 0, 1, 2, 3...
     */
    sequence: integer("sequence").notNull(),

    /*
     * PostgreSQL numeric tetap string
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
    uniqueIndex("network_topology_link_waypoints_sequence_uidx")
      .on(table.linkId, table.sequence),

    index("network_topology_link_waypoints_link_idx")
      .on(table.linkId),
  ],
);

export type NetworkTopologyLink =
  typeof networkTopologyLinks.$inferSelect;

export type NewNetworkTopologyLink =
  typeof networkTopologyLinks.$inferInsert;

export type NetworkTopologyLinkWaypoint =
  typeof networkTopologyLinkWaypoints.$inferSelect;

export type NewNetworkTopologyLinkWaypoint =
  typeof networkTopologyLinkWaypoints.$inferInsert;