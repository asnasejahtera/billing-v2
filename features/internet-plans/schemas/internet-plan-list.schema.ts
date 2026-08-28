import { z } from "zod";

export type InternetPlanListSearchParams = {
  q?: string | string[];
  status?: string | string[];
  routerId?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  order?: string | string[];
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const internetPlanListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: z.enum(["all", "ACTIVE", "INACTIVE"]).catch("all"),
  routerId: z.coerce.number().int().positive().nullable().catch(null),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().refine(
    (value) => [10, 20, 50, 100].includes(value),
  ).catch(20),
  sort: z.enum([
    "name",
    "price",
    "pppProfileName",
    "bandwidthUpTo",
    "lastSyncedAt",
  ]).catch("name"),
  order: z.enum(["asc", "desc"]).catch("asc"),
});

export function parseInternetPlanListQuery(
  params: InternetPlanListSearchParams,
) {
  const routerValue = first(params.routerId);

  return internetPlanListQuerySchema.parse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    routerId:
      routerValue && routerValue !== "all"
        ? routerValue
        : null,
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "20",
    sort: first(params.sort) ?? "name",
    order: first(params.order) ?? "asc",
  });
}

export type InternetPlanListQuery = z.infer<
  typeof internetPlanListQuerySchema
>;