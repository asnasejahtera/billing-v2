import {
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
  boolean
} from "drizzle-orm/pg-core";
import { routers } from "./routers";

export type InternetPlanStatus =
  | "ACTIVE"
  | "INACTIVE";

export const internetPlans = pgTable(
  "internet_plans",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    price: numeric("price", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),

    pppProfileName: varchar(
      "ppp_profile_name",
      {
        length: 100,
      },
    ).notNull(),

    bandwidthUpTo: varchar(
      "bandwidth_up_to",
      {
        length: 100,
      },
    ).notNull(),

    rateLimit: varchar(
      "rate_limit",
      {
        length: 255,
      },
    ),

    onlyOne: varchar("only_one", {
      length: 20,
    })
      .$type<"yes" | "no" | "default">()
      .notNull()
      .default("default"),

    status: varchar("status", {
      length: 20,
    })
      .notNull()
      .default("ACTIVE"),

    isManualOverride: boolean("is_manual_override")
      .notNull()
      .default(false),

    routerId: integer("router_id")
      .notNull()
      .references(() => routers.id, {
        onDelete: "restrict",
      }),

    ipPool: varchar("ip_pool", {
      length: 100,
    }),

    localAddress: varchar(
      "local_address",
      {
        length: 100,
      },
    ),

    mikrotikRef: varchar(
      "mikrotik_ref",
      {
        length: 100,
      },
    ),

    sourceComment: varchar(
      "source_comment",
      {
        length: 500,
      },
    ),

    lastSyncedAt: timestamp(
      "last_synced_at",
      {
        withTimezone: true,
      },
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    ).notNull().defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    ).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "internet_plans_router_profile_unique",
    ).on(
      table.routerId,
      table.pppProfileName,
    ),

    index(
      "internet_plans_router_id_idx",
    ).on(table.routerId),

    index(
      "internet_plans_name_idx",
    ).on(table.name),

    index(
      "internet_plans_status_idx",
    ).on(table.status),
  ],
);

export type InternetPlan =
  typeof internetPlans.$inferSelect;

export type NewInternetPlan =
  typeof internetPlans.$inferInsert;