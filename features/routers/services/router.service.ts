
import type { CreateRouterInput } from "@/features/routers/schemas/create-router.schema";
import type { UpdateRouterInput } from "@/features/routers/schemas/update-router.schema";
import { encryptRouterPassword } from "@/features/routers/services/router-credential.service";
import {
  parseRouterListQuery,
  type RouterListSearchParams,
} from "@/features/routers/schemas/router-list.schema";
import {
  createRouter,
  findRouterById,
  findRouterByName,
  findRouterByNameExceptId,
  listRouters,
  updateRouter,
  deactivateRouter
} from "@/features/routers/repositories/router.repository";
import {
  listRouterOptions,
} from "@/features/routers/repositories/router.repository";

export class RouterServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouterServiceError";
  }
}

export async function createRouterService(
  input: CreateRouterInput,
) {
  const existing =
    await findRouterByName(input.name);

  if (existing) {
    throw new RouterServiceError(
      "Nama router sudah digunakan",
    );
  }

  const passwordEncrypted =
    encryptRouterPassword(
      input.password,
    );

  return createRouter({
    name: input.name,
    host: input.host,
    port: input.port,
    username: input.username,
    passwordEncrypted,
    useHttps: input.useHttps,
    description: input.description,
  });
}

export async function listRouterOptionsService() {
  return listRouterOptions();
}

export async function listRoutersService(
  params: RouterListSearchParams,
) {
  const query = parseRouterListQuery(params);
  const result = await listRouters(query);
  const totalPages = Math.max(1,Math.ceil(result.total / query.pageSize),);

  return {
    ...result,
    ...query,
    totalPages,
  };
}

export async function updateRouterService(
  input: UpdateRouterInput,
) {
  const existing =
    await findRouterById(input.id);

  if (!existing) {
    throw new RouterServiceError(
      "Router tidak ditemukan",
    );
  }

  const duplicate =
    await findRouterByNameExceptId(
      input.name,
      input.id,
    );

  if (duplicate) {
    throw new RouterServiceError(
      "Nama router sudah digunakan",
    );
  }

  const passwordEncrypted =
    input.password
      ? encryptRouterPassword(
          input.password,
        )
      : undefined;

  const router = await updateRouter({
    id: input.id,
    name: input.name,
    host: input.host,
    port: input.port,
    username: input.username,
    passwordEncrypted,
    useHttps: input.useHttps,
    description: input.description,
  });

  if (!router) {
    throw new RouterServiceError(
      "Router gagal diperbarui",
    );
  }

  return router;
}

export async function deactivateRouterService(
  id: number,
) {
  const router = await findRouterById(id);

  if (!router) {
    throw new RouterServiceError(
      "Router tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new RouterServiceError(
      "Router sudah nonaktif",
    );
  }

  const result =
    await deactivateRouter(id);

  if (!result) {
    throw new RouterServiceError(
      "Router gagal dinonaktifkan",
    );
  }

  return result;
}

export async function getRouterDetailService(
  id: number,
) {
  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return findRouterById(id);
}