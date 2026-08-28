import { db } from "@/db";
import { routers } from "@/db/schema";
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
import type { RouterConnectionStatus } from "@/db/schema/routers";

export type CreateRouterRepositoryInput = {
  name: string;
  host: string;
  port: number;
  username: string;
  passwordEncrypted: string;
  useHttps: boolean;
  description?: string;
};


export type UpdateRouterRepositoryInput = {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  passwordEncrypted?: string;
  useHttps: boolean;
  description?: string;
};

export type ListRoutersRepositoryInput = {
  q: string;
  status: "all" | "active" | "inactive";
  page: number;
  pageSize: number;
  sort: "name" | "host" | "createdAt";
  order: "asc" | "desc";
};

export async function findRouterByName(
  name: string,
) {
  const [router] = await db
    .select({
      id: routers.id,
      name: routers.name,
    })
    .from(routers)
    .where(eq(routers.name, name))
    .limit(1);

  return router ?? null;
}

export async function createRouter(
  input: CreateRouterRepositoryInput,
) {
  const [router] = await db
    .insert(routers)
    .values({
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      passwordEncrypted:
        input.passwordEncrypted,
      useHttps: input.useHttps,
      description:
        input.description ?? null,
    })
    .returning({
      id: routers.id,
      name: routers.name,
      host: routers.host,
      port: routers.port,
      username: routers.username,
      useHttps: routers.useHttps,
      description: routers.description,
      isActive: routers.isActive,
      createdAt: routers.createdAt,
    });

  return router;
}

export async function listRouters(
  input: ListRoutersRepositoryInput,
) {
  const filters = [];

  if (input.q) {
    filters.push(
      or(
        ilike(routers.name, `%${input.q}%`),
        ilike(routers.host, `%${input.q}%`),
        ilike(routers.username, `%${input.q}%`),
      )!,
    );
  }

  if (input.status === "active") {
    filters.push(eq(routers.isActive, true));
  }

  if (input.status === "inactive") {
    filters.push(eq(routers.isActive, false));
  }

  const where =
    filters.length > 0
      ? and(...filters)
      : undefined;

  const sortColumn = {
    name: routers.name,
    host: routers.host,
    createdAt: routers.createdAt,
  }[input.sort];

  const orderBy =
    input.order === "asc"
      ? asc(sortColumn)
      : desc(sortColumn);

  const offset =
    (input.page - 1) * input.pageSize;

  const [data, totalResult] =
    await Promise.all([
      db
        .select({
          id: routers.id,
          name: routers.name,
          host: routers.host,
          port: routers.port,
          username: routers.username,
          useHttps: routers.useHttps,
          description: routers.description,
          isActive: routers.isActive,
          connectionStatus: routers.connectionStatus,
          lastConnectionCheckedAt:
            routers.lastConnectionCheckedAt,
          createdAt: routers.createdAt,
        })
        .from(routers)
        .where(where)
        .orderBy(orderBy)
        .limit(input.pageSize)
        .offset(offset),

      db
        .select({
          value: count(),
        })
        .from(routers)
        .where(where),
    ]);

  return {
    data,
    total: totalResult[0]?.value ?? 0,
  };
}

export async function findRouterById(
  id: number,
) {
  const [router] = await db
    .select({
      id: routers.id,
      name: routers.name,
      host: routers.host,
      port: routers.port,
      username: routers.username,
      useHttps: routers.useHttps,
      description: routers.description,
      isActive: routers.isActive,
    })
    .from(routers)
    .where(eq(routers.id, id))
    .limit(1);

  return router ?? null;
}

export async function findRouterByNameExceptId(
  name: string,
  id: number,
) {
  const [router] = await db
    .select({
      id: routers.id,
      name: routers.name,
    })
    .from(routers)
    .where(
      and(
        eq(routers.name, name),
        ne(routers.id, id),
      ),
    )
    .limit(1);

  return router ?? null;
}

export async function updateRouter(
  input: UpdateRouterRepositoryInput,
) {
  const values: {
    name: string;
    host: string;
    port: number;
    username: string;
    useHttps: boolean;
    description: string | null;
    updatedAt: Date;
    passwordEncrypted?: string;
  } = {
    name: input.name,
    host: input.host,
    port: input.port,
    username: input.username,
    useHttps: input.useHttps,
    description: input.description ?? null,
    updatedAt: new Date(),
  };

  if (input.passwordEncrypted) {
    values.passwordEncrypted =
      input.passwordEncrypted;
  }

  const [router] = await db
    .update(routers)
    .set(values)
    .where(eq(routers.id, input.id))
    .returning({
      id: routers.id,
      name: routers.name,
      host: routers.host,
      port: routers.port,
      username: routers.username,
      useHttps: routers.useHttps,
      description: routers.description,
      isActive: routers.isActive,
      updatedAt: routers.updatedAt,
    });

  return router ?? null;
}

export async function deactivateRouter(
  id: number,
) {
  const [router] = await db
    .update(routers)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(routers.id, id))
    .returning({
      id: routers.id,
      name: routers.name,
      isActive: routers.isActive,
      updatedAt: routers.updatedAt,
    });

  return router ?? null;
}

export async function findRouterConnectionById(
  id: number,
) {
  const [router] = await db
    .select({
      id: routers.id,
      name: routers.name,
      host: routers.host,
      port: routers.port,
      username: routers.username,
      passwordEncrypted:
        routers.passwordEncrypted,
      useHttps:
        routers.useHttps,
      isActive:
        routers.isActive,
    })
    .from(routers)
    .where(
      eq(routers.id, id),
    )
    .limit(1);

  return router ?? null;
}

export async function updateRouterConnectionStatus(
  id: number,
  status: RouterConnectionStatus,
) {
  const [router] = await db
    .update(routers)
    .set({
      connectionStatus: status,
      lastConnectionCheckedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(routers.id, id))
    .returning({
      id: routers.id,
      connectionStatus: routers.connectionStatus,
      lastConnectionCheckedAt:
        routers.lastConnectionCheckedAt,
    });

  return router ?? null;
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