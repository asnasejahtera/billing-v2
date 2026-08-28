
import type { SyncedInternetPlan } from "@/features/internet-plans/services/map-mikrotik-profile";
import type { SQL } from "drizzle-orm";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  notInArray,
  or,
} from "drizzle-orm";
import { db } from "@/db";
import {
  internetPlans,
  routers,
} from "@/db/schema";

export type ListInternetPlansRepositoryInput = {
  q: string;
  status: "all" | "ACTIVE" | "INACTIVE";
  routerId: number | null;
  page: number;
  pageSize: number;
  sort:
    | "name"
    | "price"
    | "pppProfileName"
    | "bandwidthUpTo"
    | "lastSyncedAt";
  order: "asc" | "desc";
};

export async function listInternetPlans(
  input: ListInternetPlansRepositoryInput,
) {
  const filters: SQL[] = [];

  if (input.q) {
    filters.push(
      or(
        ilike(internetPlans.name, `%${input.q}%`),
        ilike(internetPlans.pppProfileName, `%${input.q}%`),
        ilike(internetPlans.bandwidthUpTo, `%${input.q}%`),
        ilike(internetPlans.rateLimit, `%${input.q}%`),
        ilike(internetPlans.ipPool, `%${input.q}%`),
      )!,
    );
  }

  if (input.status !== "all") {
    filters.push(
      eq(
        internetPlans.status,
        input.status,
      ),
    );
  }

  if (input.routerId) {
    filters.push(
      eq(
        internetPlans.routerId,
        input.routerId,
      ),
    );
  }

  const where =
    filters.length > 0
      ? and(...filters)
      : undefined;

  const sortColumn = {
    name: internetPlans.name,
    price: internetPlans.price,
    pppProfileName:
      internetPlans.pppProfileName,
    bandwidthUpTo:
      internetPlans.bandwidthUpTo,
    lastSyncedAt:
      internetPlans.lastSyncedAt,
  }[input.sort];

  const orderBy =
    input.order === "asc"
      ? asc(sortColumn)
      : desc(sortColumn);

  const offset =
    (input.page - 1) *
    input.pageSize;

  const [data, totalResult] =
    await Promise.all([
      db
        .select({
          id: internetPlans.id,
          name: internetPlans.name,
          price: internetPlans.price,
          pppProfileName:
            internetPlans.pppProfileName,
          bandwidthUpTo:
            internetPlans.bandwidthUpTo,
          rateLimit:
            internetPlans.rateLimit,
          onlyOne:
            internetPlans.onlyOne,
          status:
            internetPlans.status,
          routerId:
            internetPlans.routerId,
          routerName:
            routers.name,
          routerHost:
            routers.host,
          ipPool:
            internetPlans.ipPool,
          localAddress:
            internetPlans.localAddress,
          mikrotikRef:
            internetPlans.mikrotikRef,
          sourceComment:
            internetPlans.sourceComment,
          lastSyncedAt:
            internetPlans.lastSyncedAt,
        })
        .from(internetPlans)
        .innerJoin(
          routers,
          eq(
            internetPlans.routerId,
            routers.id,
          ),
        )
        .where(where)
        .orderBy(orderBy)
        .limit(input.pageSize)
        .offset(offset),

      db
        .select({
          value: count(),
        })
        .from(internetPlans)
        .where(where),
    ]);

  return {
    data,
    total:
      totalResult[0]?.value ?? 0,
  };
}

export async function listRouterOptions() {
  return db
    .select({
      id: routers.id,
      name: routers.name,
      host: routers.host,
      connectionStatus:
        routers.connectionStatus,
    })
    .from(routers)
    .where(
      eq(routers.isActive, true),
    )
    .orderBy(
      asc(routers.name),
    );
}

export async function upsertSyncedInternetPlan(
  routerId: number,
  input: SyncedInternetPlan,
) {
  const now = new Date();

  const existing =
    await findInternetPlanByRouterProfile(
      routerId,
      input.pppProfileName,
    );

  if (!existing) {
    const [plan] = await db
      .insert(internetPlans)
      .values({
        routerId,
        name: input.name,
        price: input.price,
        pppProfileName:
          input.pppProfileName,
        bandwidthUpTo:
          input.bandwidthUpTo,
        rateLimit:
          input.rateLimit ?? null,
        onlyOne: input.onlyOne,
        status: "ACTIVE",
        isManualOverride: false,
        ipPool:
          input.ipPool ?? null,
        localAddress:
          input.localAddress ?? null,
        mikrotikRef:
          input.mikrotikRef ?? null,
        sourceComment:
          input.sourceComment ?? null,
        lastSyncedAt: now,
      })
      .returning({
        id: internetPlans.id,
        name: internetPlans.name,
      });

    return plan;
  }

  const values = {
    bandwidthUpTo:
      input.bandwidthUpTo,
    rateLimit:
      input.rateLimit ?? null,
    onlyOne: input.onlyOne,
    status: "ACTIVE" as const,
    ipPool:
      input.ipPool ?? null,
    localAddress:
      input.localAddress ?? null,
    mikrotikRef:
      input.mikrotikRef ?? null,
    sourceComment:
      input.sourceComment ?? null,
    lastSyncedAt: now,
    updatedAt: now,
    ...(!existing.isManualOverride
      ? {
          name: input.name,
          price: input.price,
        }
      : {}),
  };

  const [plan] = await db
    .update(internetPlans)
    .set(values)
    .where(
      eq(
        internetPlans.id,
        existing.id,
      ),
    )
    .returning({
      id: internetPlans.id,
      name: internetPlans.name,
    });

  return plan;
}

export async function markMissingInternetPlansInactive(
  routerId: number,
  profileNames: string[],
) {
  const now = new Date();

  if (profileNames.length === 0) {
    await db
      .update(internetPlans)
      .set({
        status: "INACTIVE",
        updatedAt: now,
      })
      .where(
        eq(
          internetPlans.routerId,
          routerId,
        ),
      );

    return;
  }

  await db
    .update(internetPlans)
    .set({
      status: "INACTIVE",
      updatedAt: now,
    })
    .where(
      and(
        eq(
          internetPlans.routerId,
          routerId,
        ),
        notInArray(
          internetPlans.pppProfileName,
          profileNames,
        ),
      ),
    );
}

export async function findInternetPlanByRouterProfile(
  routerId: number,
  pppProfileName: string,
) {
  const [plan] = await db
    .select({
      id: internetPlans.id,
      isManualOverride:
        internetPlans.isManualOverride,
    })
    .from(internetPlans)
    .where(
      and(
        eq(
          internetPlans.routerId,
          routerId,
        ),
        eq(
          internetPlans.pppProfileName,
          pppProfileName,
        ),
      ),
    )
    .limit(1);

  return plan ?? null;
}


export async function findInternetPlanById(
  id: number,
) {
  const [plan] = await db
    .select({
      id: internetPlans.id,
      name: internetPlans.name,
      price: internetPlans.price,
      status: internetPlans.status,
    })
    .from(internetPlans)
    .where(
      eq(
        internetPlans.id,
        id,
      ),
    )
    .limit(1);

  return plan ?? null;
}

export async function updateInternetPlanLocalFields(
  id: number,
  name: string,
  price: string,
) {
  const [plan] = await db
    .update(internetPlans)
    .set({
      name,
      price,
      isManualOverride: true,
      updatedAt: new Date(),
    })
    .where(
      eq(
        internetPlans.id,
        id,
      ),
    )
    .returning({
      id: internetPlans.id,
      name: internetPlans.name,
      price: internetPlans.price,
      isManualOverride:
        internetPlans.isManualOverride,
    });

  return plan ?? null;
}