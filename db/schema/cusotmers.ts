import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { internetPlans } from "./internet-plans";
import { routers } from "./routers";

export type CustomerStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "INACTIVE";

export const customers = pgTable(
  "customers",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }),

    internetPlanId: integer("internet_plan_id")
      .notNull()
      .references(() => internetPlans.id, {
        onDelete: "restrict",
      }),

    routerId: integer("router_id")
      .notNull()
      .references(() => routers.id, {
        onDelete: "restrict",
      }),

    pppoeUsername: varchar("pppoe_username", {
      length: 100,
    }).notNull(),

    // Plaintext sesuai requirement project saat ini.
    pppoePassword: varchar("pppoe_password", {
      length: 255,
    }).notNull(),

    pppProfileName: varchar("ppp_profile_name", {
      length: 100,
    }).notNull(),

    address: varchar("address", { length: 500 }),
    ipAddress: varchar("ip_address", { length: 45 }),

    localAddress: varchar("local_address", {
      length: 100,
    }),

    remoteAddress: varchar("remote_address", {
      length: 100,
    }),

    cpeBrand: varchar("cpe_brand", {
      length: 100,
    }),

    ontSerialNumber: varchar("ont_serial_number", {
      length: 100,
    }),

    isOnline: boolean("is_online")
      .notNull()
      .default(false),

    uptime: varchar("uptime", { length: 100 }),

    uptimeSeconds: integer("uptime_seconds"),

    lastCallerId: varchar("last_caller_id", {
      length: 255,
    }),

    onuPortId: integer("onu_port_id"),
    onuId: integer("onu_id"),

    onuName: varchar("onu_name", {
      length: 150,
    }),

    onuMacAddress: varchar("onu_mac_address", {
      length: 30,
    }),

    onuPonMacAddress: varchar("onu_pon_mac_address", {
      length: 30,
    }),

    onuVlanId: integer("onu_vlan_id"),

    onuStatus: varchar("onu_status", {
      length: 30,
    }),

    onuReceivePower: varchar("onu_receive_power", {
      length: 30,
    }),

    onuDistanceMeters: integer("onu_distance_meters"),

    onuRtt: varchar("onu_rtt", {
      length: 30,
    }),

    onuType: varchar("onu_type", {
      length: 100,
    }),

    onuDeviceType: varchar("onu_device_type", {
      length: 100,
    }),

    onuVendor: varchar("onu_vendor", {
      length: 100,
    }),

    onuLastDownReason: varchar("onu_last_down_reason", {
      length: 255,
    }),

    onuRegisterTime: varchar("onu_register_time", {
      length: 100,
    }),

    onuLastDownTime: varchar("onu_last_down_time", {
      length: 100,
    }),

    onuMatchedAt: timestamp("onu_matched_at", {
      withTimezone: true,
    }),

    status: varchar("status", { length: 20 })
      .$type<CustomerStatus>()
      .notNull()
      .default("ACTIVE"),

    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
    }),

    lastLogoutAt: timestamp("last_logout_at", {
      withTimezone: true,
    }),

    detail: text("detail"),

    mikrotikRef: varchar("mikrotik_ref", {
      length: 100,
    }),

    lastSyncedAt: timestamp("last_synced_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "customers_router_pppoe_username_unique",
    ).on(
      table.routerId,
      table.pppoeUsername,
    ),

    index("customers_name_idx").on(table.name),
    index("customers_phone_idx").on(table.phone),
    index("customers_router_idx").on(table.routerId),
    index("customers_plan_idx").on(table.internetPlanId),
    index("customers_status_idx").on(table.status),
    index("customers_online_idx").on(table.isOnline),
  ],
);