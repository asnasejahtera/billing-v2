import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export type RouterConnectionStatus =
  | "UNKNOWN"
  | "ONLINE"
  | "OFFLINE";

export const routers = pgTable(
  "routers",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 })
      .notNull()
      .unique(),
    host: varchar("host", { length: 255 })
      .notNull(),
    port: integer("port")
      .notNull()
      .default(8728),
    username: varchar("username", { length: 100 })
      .notNull(),
    passwordEncrypted: varchar("password_encrypted", {
      length: 1000,
    }).notNull(),
    useHttps: boolean("use_https")
      .notNull()
      .default(false),
    description: varchar("description", {
      length: 500,
    }),
    isActive: boolean("is_active")
      .notNull()
      .default(true),

    connectionStatus: varchar("connection_status", {
      length: 20,
    })
      .$type<RouterConnectionStatus>()
      .notNull()
      .default("UNKNOWN"),

    lastConnectionCheckedAt: timestamp(
      "last_connection_checked_at",
      {
        withTimezone: true,
      },
    ),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    index("routers_host_idx").on(table.host),
    index("routers_is_active_idx").on(table.isActive),
    index("routers_connection_status_idx").on(
      table.connectionStatus,
    ),
  ],
);