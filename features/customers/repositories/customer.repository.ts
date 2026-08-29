
import { db } from "@/db";
import type { SQL } from "drizzle-orm";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  ne
} from "drizzle-orm";
import {
  customers,
  internetPlans,
  routers,
} from "@/db/schema";

export async function updateCustomerStatus(
  id: number,
  status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE",
) {
  const [customer] =
    await db
      .update(customers)
      .set({
        status,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          customers.id,
          id,
        ),
      )
      .returning({
        id:
          customers.id,

        status:
          customers.status,
      });

  return customer ?? null;
}

export async function listInternetPlanMapByRouter(
  routerId: number,
) {
  return db
    .select({
      id: internetPlans.id,
      profileName:
        internetPlans.pppProfileName,
    })
    .from(internetPlans)
    .where(
      eq(
        internetPlans.routerId,
        routerId,
      ),
    );
}

export async function listExistingCustomersByRouter(
  routerId: number,
) {
  return db
    .select({
      id: customers.id,
      pppoeUsername:
        customers.pppoeUsername,
      isOnline:
        customers.isOnline,
      lastCallerId:
        customers.lastCallerId,
      lastLoginAt:
        customers.lastLoginAt,
      lastLogoutAt:
        customers.lastLogoutAt,
    })
    .from(customers)
    .where(
      eq(
        customers.routerId,
        routerId,
      ),
    );
}

export type SyncCustomerInput = {
  routerId: number;
  internetPlanId: number;
  name: string;
  pppoeUsername: string;
  pppoePassword: string;
  pppProfileName: string;
  ipAddress: string | null;
  localAddress: string | null;
  remoteAddress: string | null;
  isOnline: boolean;
  uptime: string | null;
  uptimeSeconds: number | null;
  lastCallerId: string | null;
  lastLoginAt: Date | null;
  lastLogoutAt: Date | null;
  mikrotikRef: string | null;
};

export async function upsertSyncedCustomer(
  input: SyncCustomerInput,
) {
  const now = new Date();

  const [existing] = await db
    .select({
      id: customers.id,
    })
    .from(customers)
    .where(
      and(
        eq(
          customers.routerId,
          input.routerId,
        ),
        eq(
          customers.pppoeUsername,
          input.pppoeUsername,
        ),
      ),
    )
    .limit(1);

  if (!existing) {
    const [customer] = await db
      .insert(customers)
      .values({
        name: input.name,
        phone: null,
        internetPlanId:
          input.internetPlanId,
        routerId: input.routerId,

        pppoeUsername:
          input.pppoeUsername,

        // Tidak dienkripsi sesuai requirement.
        pppoePassword:
          input.pppoePassword,

        pppProfileName:
          input.pppProfileName,

        address: null,
        ipAddress:
          input.ipAddress,
        localAddress:
          input.localAddress,
        remoteAddress:
          input.remoteAddress,

        cpeBrand: null,
        ontSerialNumber: null,

        isOnline:
          input.isOnline,
        uptime:
          input.uptime,
        uptimeSeconds:
          input.uptimeSeconds,

        lastCallerId:
          input.lastCallerId,

        status: "ACTIVE",

        lastLoginAt:
          input.lastLoginAt,

        lastLogoutAt:
          input.lastLogoutAt,

        detail: null,

        mikrotikRef:
          input.mikrotikRef,

        lastSyncedAt: now,
      })
      .returning({
        id: customers.id,
      });

    return {
      customer,
      created: true,
    };
  }

  const [customer] = await db
    .update(customers)
    .set({
      /*
       * Field sumber MikroTik saja.
       *
       * Phone, address, brand, SN,
       * status dan detail TIDAK disentuh.
       */
      name: input.name,
      internetPlanId:
        input.internetPlanId,

      pppoePassword:
        input.pppoePassword,

      pppProfileName:
        input.pppProfileName,

      ipAddress:
        input.ipAddress,

      localAddress:
        input.localAddress,

      remoteAddress:
        input.remoteAddress,

      isOnline:
        input.isOnline,

      uptime:
        input.uptime,

      uptimeSeconds:
        input.uptimeSeconds,

      lastCallerId:
        input.lastCallerId,

      lastLoginAt:
        input.lastLoginAt,

      lastLogoutAt:
        input.lastLogoutAt,

      mikrotikRef:
        input.mikrotikRef,

      lastSyncedAt: now,
      updatedAt: now,
    })
    .where(
      eq(
        customers.id,
        existing.id,
      ),
    )
    .returning({
      id: customers.id,
    });

  return {
    customer,
    created: false,
  };
}

export type ListCustomersRepositoryInput = {
  q: string;
  routerId: number | null;
  planId: number | null;
  status: "all" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
  online: "all" | "online" | "offline";
  page: number;
  pageSize: number;
  sort:
    | "name"
    | "pppoeUsername"
    | "status"
    | "createdAt"
    | "lastLoginAt"
    | "lastLogoutAt"
    | "lastSyncedAt";
  order: "asc" | "desc";
};

export async function listCustomers(
  input: ListCustomersRepositoryInput,
) {
  const filters: SQL[] = [];

  if (input.q) {
    filters.push(
      or(
        ilike(customers.name, `%${input.q}%`),
        ilike(customers.phone, `%${input.q}%`),
        ilike(customers.pppoeUsername, `%${input.q}%`),
        ilike(customers.pppProfileName, `%${input.q}%`),
        ilike(customers.ipAddress, `%${input.q}%`),
        ilike(customers.lastCallerId, `%${input.q}%`),
      )!,
    );
  }

  if (input.routerId) {
    filters.push(
      eq(customers.routerId, input.routerId),
    );
  }

  if (input.planId) {
    filters.push(
      eq(customers.internetPlanId, input.planId),
    );
  }

  if (input.status !== "all") {
    filters.push(
      eq(customers.status, input.status),
    );
  }

  if (input.online === "online") {
    filters.push(
      eq(customers.isOnline, true),
    );
  }

  if (input.online === "offline") {
    filters.push(
      eq(customers.isOnline, false),
    );
  }

  const where =
    filters.length > 0
      ? and(...filters)
      : undefined;

  const sortColumn = {
    name: customers.name,
    pppoeUsername: customers.pppoeUsername,
    status: customers.status,
    createdAt: customers.createdAt,
    lastLoginAt: customers.lastLoginAt,
    lastLogoutAt: customers.lastLogoutAt,
    lastSyncedAt: customers.lastSyncedAt,
  }[input.sort];

  const orderBy =
    input.order === "asc"
      ? asc(sortColumn)
      : desc(sortColumn);

  const offset =
    (input.page - 1) * input.pageSize;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        internetPlanId: customers.internetPlanId,
        planName: internetPlans.name,
        bandwidthUpTo: internetPlans.bandwidthUpTo,
        planPrice: internetPlans.price,

        routerId: customers.routerId,
        routerName: routers.name,
        routerHost: routers.host,

        pppoeUsername: customers.pppoeUsername,
        pppoePassword: customers.pppoePassword,
        pppProfileName: customers.pppProfileName,

        address: customers.address,
        ipAddress: customers.ipAddress,
        localAddress: customers.localAddress,
        remoteAddress: customers.remoteAddress,

        cpeBrand: customers.cpeBrand,
        ontSerialNumber: customers.ontSerialNumber,

        isOnline: customers.isOnline,
        uptime: customers.uptime,
        uptimeSeconds: customers.uptimeSeconds,

        lastCallerId: customers.lastCallerId,
        status: customers.status,
        lastLoginAt: customers.lastLoginAt,
        lastLogoutAt: customers.lastLogoutAt,
        detail: customers.detail,
        lastSyncedAt: customers.lastSyncedAt,
        onuReceivePower: customers.onuReceivePower,
      })
      .from(customers)
      .innerJoin(
        internetPlans,
        eq(
          customers.internetPlanId,
          internetPlans.id,
        ),
      )
      .innerJoin(
        routers,
        eq(
          customers.routerId,
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
      .from(customers)
      .where(where),
  ]);

  return {
    data,
    total:
      totalResult[0]?.value ?? 0,
  };
}

export async function listCustomerPlanOptions() {
  return db
    .select({
      id: internetPlans.id,
      name: internetPlans.name,
      routerId: internetPlans.routerId,
      pppProfileName:
        internetPlans.pppProfileName,
      bandwidthUpTo:
        internetPlans.bandwidthUpTo,
      price:
        internetPlans.price,
    })
    .from(internetPlans)
    .where(
      eq(
        internetPlans.status,
        "ACTIVE",
      ),
    )
    .orderBy(
      asc(internetPlans.name),
    );
}

export async function findCustomerByRouterUsername(
  routerId: number,
  username: string,
) {
  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
    })
    .from(customers)
    .where(
      and(
        eq(customers.routerId, routerId),
        eq(customers.pppoeUsername, username),
      ),
    )
    .limit(1);

  return customer ?? null;
}

export async function findInternetPlanForCustomer(
  planId: number,
  routerId: number,
) {
  const [plan] = await db
    .select({
      id: internetPlans.id,
      name: internetPlans.name,
      pppProfileName: internetPlans.pppProfileName,
      status: internetPlans.status,
      routerId: internetPlans.routerId,
    })
    .from(internetPlans)
    .where(
      and(
        eq(internetPlans.id, planId),
        eq(internetPlans.routerId, routerId),
      ),
    )
    .limit(1);

  return plan ?? null;
}

export type CreateCustomerRepositoryInput = {
  name: string;
  phone: string | null;
  routerId: number;
  internetPlanId: number;
  pppoeUsername: string;
  pppoePassword: string;
  pppProfileName: string;
  address: string | null;
  localAddress: string | null;
  remoteAddress: string | null;
  cpeBrand: string | null;
  ontSerialNumber: string | null;
  detail: string | null;
  mikrotikRef: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
};

export async function createCustomer(
  input: CreateCustomerRepositoryInput,
) {
  const [customer] = await db
    .insert(customers)
    .values({
      name: input.name,
      phone: input.phone,
      routerId: input.routerId,
      internetPlanId: input.internetPlanId,

      pppoeUsername: input.pppoeUsername,

      // Plaintext sesuai requirement saat ini.
      pppoePassword: input.pppoePassword,

      pppProfileName: input.pppProfileName,

      address: input.address,

      ipAddress: null,

      localAddress: input.localAddress,
      remoteAddress: input.remoteAddress,

      cpeBrand: input.cpeBrand,
      ontSerialNumber: input.ontSerialNumber,

      isOnline: false,
      uptime: null,
      uptimeSeconds: null,

      lastCallerId: null,

      status: input.status,

      lastLoginAt: null,
      lastLogoutAt: null,

      detail: input.detail,

      mikrotikRef: input.mikrotikRef,
      lastSyncedAt: null,
    })
    .returning({
      id: customers.id,
      name: customers.name,
      pppoeUsername: customers.pppoeUsername,
    });

  return customer;
}

export async function findCustomerForEdit(
  id: number,
) {
  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,

      routerId:
        customers.routerId,

      internetPlanId:
        customers.internetPlanId,

      pppoeUsername:
        customers.pppoeUsername,

      pppoePassword:
        customers.pppoePassword,

      pppProfileName:
        customers.pppProfileName,

      address:
        customers.address,

      localAddress:
        customers.localAddress,

      remoteAddress:
        customers.remoteAddress,

      cpeBrand:
        customers.cpeBrand,

      ontSerialNumber:
        customers.ontSerialNumber,

      detail:
        customers.detail,

      status:
        customers.status,

      mikrotikRef:
        customers.mikrotikRef,
    })
    .from(customers)
    .where(
      eq(
        customers.id,
        id,
      ),
    )
    .limit(1);

  return customer ?? null;
}

export async function findCustomerByRouterUsernameExceptId(
  routerId: number,
  username: string,
  customerId: number,
) {
  const [customer] = await db
    .select({
      id: customers.id,
    })
    .from(customers)
    .where(
      and(
        eq(
          customers.routerId,
          routerId,
        ),
        eq(
          customers.pppoeUsername,
          username,
        ),
        ne(
          customers.id,
          customerId,
        ),
      ),
    )
    .limit(1);

  return customer ?? null;
}

export type UpdateCustomerRepositoryInput = {
  id: number;
  name: string;
  phone: string | null;

  internetPlanId: number;

  pppoeUsername: string;
  pppoePassword: string;
  pppProfileName: string;

  address: string | null;
  localAddress: string | null;
  remoteAddress: string | null;

  cpeBrand: string | null;
  ontSerialNumber: string | null;

  status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";

  detail: string | null;
  mikrotikRef: string;
};

export async function updateCustomer(
  input: UpdateCustomerRepositoryInput,
) {
  const [customer] = await db
    .update(customers)
    .set({
      name:
        input.name,

      phone:
        input.phone,

      internetPlanId:
        input.internetPlanId,

      pppoeUsername:
        input.pppoeUsername,

      pppoePassword:
        input.pppoePassword,

      pppProfileName:
        input.pppProfileName,

      address:
        input.address,

      localAddress:
        input.localAddress,

      remoteAddress:
        input.remoteAddress,

      cpeBrand:
        input.cpeBrand,

      ontSerialNumber:
        input.ontSerialNumber,

      status:
        input.status,

      detail:
        input.detail,

      mikrotikRef:
        input.mikrotikRef,

      updatedAt:
        new Date(),
    })
    .where(
      eq(
        customers.id,
        input.id,
      ),
    )
    .returning({
      id: customers.id,
      name: customers.name,
    });

  return customer ?? null;
}