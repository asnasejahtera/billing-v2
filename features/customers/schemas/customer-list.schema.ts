import { z } from "zod";

export type CustomerListSearchParams = {
  q?: string | string[];
  routerId?: string | string[];
  planId?: string | string[];
  status?: string | string[];
  online?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  order?: string | string[];
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const customerListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  routerId: z.coerce.number().int().positive().nullable().catch(null),
  planId: z.coerce.number().int().positive().nullable().catch(null),
  status: z.enum(["all", "ACTIVE", "SUSPENDED", "INACTIVE"]).catch("all"),
  online: z.enum(["all", "online", "offline"]).catch("all"),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().refine(
    (value) => [10, 20, 50, 100].includes(value),
  ).catch(20),
  sort: z.enum([
    "name",
    "pppoeUsername",
    "status",
    "createdAt",
    "lastLoginAt",
    "lastLogoutAt",
    "lastSyncedAt",
  ]).catch("createdAt"),
  order: z.enum(["asc", "desc"]).catch("asc"),
});

export function parseCustomerListQuery(
  params: CustomerListSearchParams,
) {
  const routerId = first(params.routerId);
  const planId = first(params.planId);

  return customerListQuerySchema.parse({
    q: first(params.q) ?? "",
    routerId: routerId && routerId !== "all" ? routerId : null,
    planId: planId && planId !== "all" ? planId : null,
    status: first(params.status) ?? "all",
    online: first(params.online) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "20",
    sort:first(params.sort) ?? "createdAt",
    order:first(params.order) ?? "desc",
  });
}

export type CustomerListQuery = z.infer<
  typeof customerListQuerySchema
>;