import { z } from "zod";

export type RouterListSearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  order?: string | string[];
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const routerListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().refine(
    (value) => [10, 20, 50, 100].includes(value),
  ).catch(20),
  sort: z.enum(["name", "host", "createdAt"]).catch("createdAt"),
  order: z.enum(["asc", "desc"]).catch("desc"),
});

export function parseRouterListQuery(
  params: RouterListSearchParams,
) {
  return routerListQuerySchema.parse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "20",
    sort: first(params.sort) ?? "createdAt",
    order: first(params.order) ?? "desc",
  });
}

export type RouterListQuery = z.infer<
  typeof routerListQuerySchema
>;