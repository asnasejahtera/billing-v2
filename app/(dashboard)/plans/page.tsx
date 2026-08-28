import Link from "next/link";
import {
    ArrowUpDown,
    Package,
    Search,
} from "lucide-react";
import { SyncInternetPlans } from "@/features/internet-plans/components/sync-internet-plans";
import { InternetPlanRow } from "@/features/internet-plans/components/internet-plan-row";
import { listInternetPlansService } from "@/features/internet-plans/services/internet-plan.service";
import type { InternetPlanListSearchParams } from "@/features/internet-plans/schemas/internet-plan-list.schema";
import { listRouterOptionsService } from "@/features/routers/services/router.service";
import { Badge } from "@/components/ui/badge";
import {
    Button,
    buttonVariants,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PlansPageProps = {
    searchParams: Promise<InternetPlanListSearchParams>;
};

export default async function PlansPage({
    searchParams,
}: PlansPageProps) {
    const params =
        await searchParams;

    const [result, routers] =
        await Promise.all([
            listInternetPlansService(
                params,
            ),
            listRouterOptionsService(),
        ]);

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Paket Internet
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Paket Internet hasil sinkron
                        PPP Profile MikroTik.
                    </p>
                </div>

                <SyncInternetPlans
                    routers={routers}
                />
            </div>

            <PlanToolbar
                result={result}
                routers={routers}
            />

            <div className="overflow-hidden rounded-lg border bg-background">
                {result.data.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHead
                                        label="Nama Paket"
                                        field="name"
                                        result={result}
                                    />

                                    <SortableHead
                                        label="Harga"
                                        field="price"
                                        result={result}
                                    />

                                    <SortableHead
                                        label="PPP Profile"
                                        field="pppProfileName"
                                        result={result}
                                        className="hidden md:table-cell"
                                    />

                                    <SortableHead
                                        label="Bandwidth Up To"
                                        field="bandwidthUpTo"
                                        result={result}
                                        className="hidden lg:table-cell"
                                    />

                                    <TableHead className="hidden lg:table-cell">
                                        Rate Limit
                                    </TableHead>

                                    <TableHead className="hidden xl:table-cell">
                                        IP Pool
                                    </TableHead>

                                    <TableHead className="hidden xl:table-cell">
                                        Local Address
                                    </TableHead>

                                    <TableHead className="hidden 2xl:table-cell">
                                        Only One
                                    </TableHead>

                                    <TableHead>
                                        Router
                                    </TableHead>

                                    <TableHead>
                                        Status
                                    </TableHead>

                                    <SortableHead
                                        label="Sync"
                                        field="lastSyncedAt"
                                        result={result}
                                        className="hidden 2xl:table-cell"
                                    />

                                    <TableHead className="w-12">
                                        <span className="sr-only">
                                            Aksi
                                        </span>
                                    </TableHead>

                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {result.data.map((plan) => (
                                    <InternetPlanRow
                                        key={plan.id}
                                        plan={{
                                            id: plan.id,
                                            name: plan.name,
                                            price: plan.price,
                                            pppProfileName:
                                                plan.pppProfileName,
                                            bandwidthUpTo:
                                                plan.bandwidthUpTo,
                                            rateLimit:
                                                plan.rateLimit,
                                            onlyOne:
                                                plan.onlyOne,
                                            status:
                                                plan.status,
                                            routerName:
                                                plan.routerName,
                                            routerHost:
                                                plan.routerHost,
                                            ipPool:
                                                plan.ipPool,
                                            localAddress:
                                                plan.localAddress,
                                            lastSyncedAt:
                                                plan.lastSyncedAt
                                                    ?.toISOString() ??
                                                null,
                                        }}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <PlanPagination
                result={result}
            />
        </div>
    );
}

type PlanResult = Awaited<
    ReturnType<
        typeof listInternetPlansService
    >
>;

type RouterOption = Awaited<
    ReturnType<
        typeof listRouterOptionsService
    >
>[number];

function PlanToolbar({
    result,
    routers,
}: {
    result: PlanResult;
    routers: RouterOption[];
}) {
    return (
        <form
            action="/plans"
            method="get"
            className="grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-2 xl:flex xl:items-center"
        >
            <div className="relative min-w-0 flex-1 md:col-span-2 xl:col-span-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    name="q"
                    defaultValue={result.q}
                    placeholder="Cari paket, profile, rate limit, IP Pool..."
                    className="pl-9"
                />
            </div>

            <select
                name="routerId"
                defaultValue={
                    result.routerId
                        ? String(
                            result.routerId,
                        )
                        : "all"
                }
                className="h-9 rounded-md border bg-background px-3 text-sm"
            >
                <option value="all">
                    Semua router
                </option>

                {routers.map(
                    (router) => (
                        <option
                            key={router.id}
                            value={router.id}
                        >
                            {router.name}
                        </option>
                    ),
                )}
            </select>

            <select
                name="status"
                defaultValue={
                    result.status
                }
                className="h-9 rounded-md border bg-background px-3 text-sm"
            >
                <option value="all">
                    Semua status
                </option>
                <option value="ACTIVE">
                    Aktif
                </option>
                <option value="INACTIVE">
                    Nonaktif
                </option>
            </select>

            <select
                name="pageSize"
                defaultValue={String(
                    result.pageSize,
                )}
                className="h-9 rounded-md border bg-background px-3 text-sm"
            >
                <option value="10">
                    10 / halaman
                </option>
                <option value="20">
                    20 / halaman
                </option>
                <option value="50">
                    50 / halaman
                </option>
                <option value="100">
                    100 / halaman
                </option>
            </select>

            <input
                type="hidden"
                name="sort"
                value={result.sort}
            />

            <input
                type="hidden"
                name="order"
                value={result.order}
            />

            <div className="flex gap-2 md:col-span-2 xl:col-span-1">
                <Button
                    type="submit"
                    variant="secondary"
                    className="flex-1 xl:flex-none"
                >
                    <Search />
                    Terapkan
                </Button>

                <Link
                    href="/plans"
                    className={cn(
                        buttonVariants({
                            variant: "outline",
                        }),
                        "flex-1 xl:flex-none",
                    )}
                >
                    Reset
                </Link>
            </div>
        </form>
    );
}

function SortableHead({
    label,
    field,
    result,
    className,
}: {
    label: string;
    field:
    | "name"
    | "price"
    | "pppProfileName"
    | "bandwidthUpTo"
    | "lastSyncedAt";
    result: PlanResult;
    className?: string;
}) {
    const nextOrder =
        result.sort === field &&
            result.order === "asc"
            ? "desc"
            : "asc";

    return (
        <TableHead
            className={className}
        >
            <Link
                href={buildPlanUrl(
                    result,
                    {
                        sort: field,
                        order: nextOrder,
                        page: 1,
                    },
                )}
                className="inline-flex items-center gap-1 hover:text-foreground"
            >
                {label}
                <ArrowUpDown className="size-3.5" />
            </Link>
        </TableHead>
    );
}

function PlanPagination({
    result,
}: {
    result: PlanResult;
}) {
    const from =
        result.total === 0
            ? 0
            : (result.page - 1) *
            result.pageSize +
            1;

    const to = Math.min(
        result.page *
        result.pageSize,
        result.total,
    );

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {from}-{to} dari{" "}
                {result.total} paket
            </p>

            <div className="flex items-center gap-2">
                <PaginationLink
                    enabled={
                        result.page > 1
                    }
                    href={buildPlanUrl(
                        result,
                        {
                            page:
                                result.page - 1,
                        },
                    )}
                >
                    Sebelumnya
                </PaginationLink>

                <span className="min-w-20 text-center text-sm">
                    {result.page} /{" "}
                    {result.totalPages}
                </span>

                <PaginationLink
                    enabled={
                        result.page <
                        result.totalPages
                    }
                    href={buildPlanUrl(
                        result,
                        {
                            page:
                                result.page + 1,
                        },
                    )}
                >
                    Berikutnya
                </PaginationLink>
            </div>
        </div>
    );
}

function PaginationLink({
    enabled,
    href,
    children,
}: {
    enabled: boolean;
    href: string;
    children: React.ReactNode;
}) {
    if (!enabled) {
        return (
            <span
                className={cn(
                    buttonVariants({
                        variant: "outline",
                        size: "sm",
                    }),
                    "pointer-events-none opacity-50",
                )}
            >
                {children}
            </span>
        );
    }

    return (
        <Link
            href={href}
            className={buttonVariants({
                variant: "outline",
                size: "sm",
            })}
        >
            {children}
        </Link>
    );
}

function EmptyState() {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Package className="size-5 text-muted-foreground" />
            </div>

            <p className="font-medium">
                Belum ada Paket Internet
            </p>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Pilih router lalu gunakan
                Sync MikroTik untuk mengambil
                PPP Profile.
            </p>
        </div>
    );
}

function formatCurrency(
    value: string,
) {
    const amount =
        Number(value);

    if (
        !Number.isFinite(amount)
    ) {
        return "Rp0";
    }

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        },
    ).format(amount);
}

function formatOnlyOne(
    value:
        | "yes"
        | "no"
        | "default",
) {
    if (value === "yes") {
        return "Ya";
    }

    if (value === "no") {
        return "Tidak";
    }

    return "Default";
}

function buildPlanUrl(
    result: PlanResult,
    changes: Partial<{
        q: string;
        status:
        | "all"
        | "ACTIVE"
        | "INACTIVE";
        routerId:
        | number
        | null;
        page: number;
        pageSize: number;
        sort:
        | "name"
        | "price"
        | "pppProfileName"
        | "bandwidthUpTo"
        | "lastSyncedAt";
        order:
        | "asc"
        | "desc";
    }>,
) {
    const query = {
        q: result.q,
        status: result.status,
        routerId:
            result.routerId,
        page: result.page,
        pageSize:
            result.pageSize,
        sort: result.sort,
        order: result.order,
        ...changes,
    };

    const params =
        new URLSearchParams();

    if (query.q) {
        params.set(
            "q",
            query.q,
        );
    }

    if (
        query.status !== "all"
    ) {
        params.set(
            "status",
            query.status,
        );
    }

    if (query.routerId) {
        params.set(
            "routerId",
            String(query.routerId),
        );
    }

    params.set(
        "page",
        String(query.page),
    );

    params.set(
        "pageSize",
        String(query.pageSize),
    );

    params.set(
        "sort",
        query.sort,
    );

    params.set(
        "order",
        query.order,
    );

    return `/plans?${params.toString()}`;
}