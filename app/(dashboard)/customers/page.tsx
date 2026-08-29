import Link from "next/link";
import {
    Plus,
    Search,
} from "lucide-react";

import {
    buttonVariants,
    Button,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CustomerCreatedToast } from "@/features/customers/components/customer-created-toast";
import {
    CustomersTable,
    type CustomerTableData,
} from "@/features/customers/components/customers-table";
import { SyncCustomers } from "@/features/customers/components/sync-customers";
import { SyncOltCustomers } from "@/features/customers/components/sync-olt-customers";
import {
    listCustomerPlanOptionsService,
    listCustomersService,
} from "@/features/customers/services/customer.service";
import { listRouterOptionsService } from "@/features/routers/services/router.service";

import { cn } from "@/lib/utils";

type CustomerSort =
    | "name"
    | "pppoeUsername"
    | "status"
    | "createdAt"
    | "lastLoginAt"
    | "lastLogoutAt"
    | "lastSyncedAt";

type CustomerOrder =
    | "asc"
    | "desc";

type CustomersPageProps = {
    searchParams: Promise<{
        q?: string;
        routerId?: string;
        planId?: string;
        status?: string;
        online?: string;
        sort?: string;
        order?: string;
        page?: string;
        pageSize?: string;
        created?: string;
    }>;
};

function resolveSort(
    value?: string,
): CustomerSort {
    const allowed:
        CustomerSort[] = [
            "name",
            "pppoeUsername",
            "status",
            "createdAt",
            "lastLoginAt",
            "lastLogoutAt",
            "lastSyncedAt",
        ];

    return allowed.includes(
        value as CustomerSort,
    )
        ? (value as CustomerSort)
        : "createdAt";
}

function resolveOrder(
    value?: string,
): CustomerOrder {
    return value === "asc"
        ? "asc"
        : "desc";
}

export default async function CustomersPage({
    searchParams,
}: CustomersPageProps) {
    const params =
        await searchParams;

    /*
     * Default sorting:
     *
     * Customer terbaru
     * berada paling atas.
     */
    const sort =
        resolveSort(
            params.sort,
        );

    const order =
        resolveOrder(
            params.order,
        );

    const query = {
        q:
            params.q ?? "",

        routerId:
            params.routerId ??
            "",

        planId:
            params.planId ??
            "",

        status:
            params.status ??
            "all",

        online:
            params.online ??
            "all",

        sort,

        order,

        page:
            params.page ?? "1",

        pageSize:
            params.pageSize ??
            "20",
    };

    const [
        result,
        routers,
        plans,
    ] = await Promise.all([
        listCustomersService(
            query,
        ),

        listRouterOptionsService(),

        listCustomerPlanOptionsService(),
    ]);

    const customerCreated =
        params.created === "1";

    const currentPage =
        result.page;

    const totalPages =
        result.totalPages;

    /*
     * ==========================================
     * BUILD PAGINATION URL
     * ==========================================
     */
    function buildPageUrl(
        page: number,
    ) {
        const search =
            new URLSearchParams();

        if (query.q) {
            search.set(
                "q",
                query.q,
            );
        }

        if (query.routerId) {
            search.set(
                "routerId",
                query.routerId,
            );
        }

        if (query.planId) {
            search.set(
                "planId",
                query.planId,
            );
        }

        if (
            query.status !==
            "all"
        ) {
            search.set(
                "status",
                query.status,
            );
        }

        if (
            query.online !==
            "all"
        ) {
            search.set(
                "online",
                query.online,
            );
        }

        search.set(
            "sort",
            query.sort,
        );

        search.set(
            "order",
            query.order,
        );

        search.set(
            "page",
            String(page),
        );

        search.set(
            "pageSize",
            query.pageSize,
        );

        return `/customers?${search.toString()}`;
    }

    const customers:
        CustomerTableData[] =
        result.data.map(
            (customer) => ({
                id:
                    customer.id,

                name:
                    customer.name,

                phone:
                    customer.phone,

                routerId:
                    customer.routerId,

                routerName:
                    customer.routerName,

                routerHost:
                    customer.routerHost,

                internetPlanId:
                    customer.internetPlanId,

                planName:
                    customer.planName,

                bandwidthUpTo:
                    customer.bandwidthUpTo,

                planPrice:
                    customer.planPrice,

                pppoeUsername:
                    customer.pppoeUsername,

                pppoePassword:
                    customer.pppoePassword,

                pppProfileName:
                    customer.pppProfileName,

                address:
                    customer.address,

                ipAddress:
                    customer.ipAddress,

                localAddress:
                    customer.localAddress,

                remoteAddress:
                    customer.remoteAddress,

                cpeBrand:
                    customer.cpeBrand,

                ontSerialNumber:
                    customer.ontSerialNumber,

                isOnline:
                    customer.isOnline,

                uptime:
                    customer.uptime,

                lastCallerId:
                    customer.lastCallerId,

                onuReceivePower:
                    customer.onuReceivePower,

                status:
                    customer.status,

                lastLoginAt:
                    customer.lastLoginAt
                        ?.toISOString() ??
                    null,

                lastLogoutAt:
                    customer.lastLogoutAt
                        ?.toISOString() ??
                    null,

                detail:
                    customer.detail,

                lastSyncedAt:
                    customer.lastSyncedAt
                        ?.toISOString() ??
                    null,
            }),
        );

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">

            {/* CREATE SUCCESS TOAST */}

            <CustomerCreatedToast
                created={
                    customerCreated
                }
            />

            {/* ====================================== */}
            {/* PAGE HEADER */}
            {/* ====================================== */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Customer
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola pelanggan,
                        paket Internet dan
                        akun PPPoE MikroTik.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <SyncCustomers
                        routers={
                            routers
                        }
                    />

                    <SyncOltCustomers />

                    <Link
                        href="/customers/new"
                        className={cn(
                            buttonVariants(),
                            "gap-2",
                        )}
                    >
                        <Plus className="size-4" />

                        Tambah Customer
                    </Link>
                </div>
            </div>

            {/* ====================================== */}
            {/* FILTER */}
            {/* ====================================== */}

            <div className="rounded-xl border bg-card p-4">
                <form
                    method="GET"
                    action="/customers"
                    className="grid gap-3 md:grid-cols-2 xl:grid-cols-12"
                >
                    {/* SEARCH */}

                    <div className="relative md:col-span-2 xl:col-span-4">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            name="q"
                            defaultValue={
                                query.q
                            }
                            placeholder="Cari nama atau PPPoE user..."
                            className="pl-9"
                        />
                    </div>

                    {/* ROUTER */}

                    <select
                        name="routerId"
                        defaultValue={
                            query.routerId
                        }
                        className="h-9 rounded-md border bg-background px-3 text-sm xl:col-span-2"
                    >
                        <option value="">
                            Semua Router
                        </option>

                        {routers.map(
                            (router) => (
                                <option
                                    key={
                                        router.id
                                    }
                                    value={
                                        router.id
                                    }
                                >
                                    {
                                        router.name
                                    }
                                </option>
                            ),
                        )}
                    </select>

                    {/* PLAN */}

                    <select
                        name="planId"
                        defaultValue={
                            query.planId
                        }
                        className="h-9 rounded-md border bg-background px-3 text-sm xl:col-span-2"
                    >
                        <option value="">
                            Semua Paket
                        </option>

                        {plans.map(
                            (plan) => (
                                <option
                                    key={
                                        plan.id
                                    }
                                    value={
                                        plan.id
                                    }
                                >
                                    {
                                        plan.name
                                    }
                                </option>
                            ),
                        )}
                    </select>

                    {/* STATUS */}

                    <select
                        name="status"
                        defaultValue={
                            query.status
                        }
                        className="h-9 rounded-md border bg-background px-3 text-sm xl:col-span-1"
                    >
                        <option value="all">
                            Semua Status
                        </option>

                        <option value="ACTIVE">
                            Aktif
                        </option>

                        <option value="SUSPENDED">
                            Suspend
                        </option>

                        <option value="INACTIVE">
                            Nonaktif
                        </option>
                    </select>

                    {/* ONLINE */}

                    <select
                        name="online"
                        defaultValue={
                            query.online
                        }
                        className="h-9 rounded-md border bg-background px-3 text-sm xl:col-span-1"
                    >
                        <option value="all">
                            Semua Koneksi
                        </option>

                        <option value="online">
                            Online
                        </option>

                        <option value="offline">
                            Offline
                        </option>
                    </select>

                    {/*
           * Sorting dipertahankan
           * ketika Filter ditekan.
           */}

                    <input
                        type="hidden"
                        name="sort"
                        value={
                            query.sort
                        }
                    />

                    <input
                        type="hidden"
                        name="order"
                        value={
                            query.order
                        }
                    />

                    <input
                        type="hidden"
                        name="pageSize"
                        value={
                            query.pageSize
                        }
                    />

                    <input
                        type="hidden"
                        name="page"
                        value="1"
                    />

                    <Button
                        type="submit"
                        variant="outline"
                        className="xl:col-span-1"
                    >
                        Filter
                    </Button>

                    <Link
                        href="/customers?sort=createdAt&order=desc"
                        className={cn(
                            buttonVariants({
                                variant:
                                    "ghost",
                            }),
                            "xl:col-span-1",
                        )}
                    >
                        Reset
                    </Link>
                </form>
            </div>

            {/* ====================================== */}
            {/* INFORMATION */}
            {/* ====================================== */}

            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                    Menampilkan{" "}
                    <span className="font-semibold text-foreground">
                        {
                            result.data.length
                        }
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-foreground">
                        {
                            result.total
                        }
                    </span>{" "}
                    Customer
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    <span>
                        Urutan:
                    </span>

                    <span className="font-medium text-foreground">
                        {query.sort ===
                            "createdAt"
                            ? "Tanggal Dibuat"
                            : query.sort ===
                                "name"
                                ? "Customer"
                                : query.sort ===
                                    "pppoeUsername"
                                    ? "PPPoE User"
                                    : query.sort ===
                                        "status"
                                        ? "Status"
                                        : query.sort ===
                                            "lastLoginAt"
                                            ? "Last Login"
                                            : query.sort ===
                                                "lastLogoutAt"
                                                ? "Last Logout"
                                                : "Last Sync"}
                    </span>

                    <span>
                        {query.order ===
                            "asc"
                            ? "↑"
                            : "↓"}
                    </span>
                </div>
            </div>

            {/* ====================================== */}
            {/* TABLE */}
            {/* ====================================== */}

            <CustomersTable
                customers={
                    customers
                }
                plans={plans}
                sort={query.sort}
                order={
                    query.order
                }
                searchParams={{
                    q:
                        query.q,

                    routerId:
                        query.routerId,

                    planId:
                        query.planId,

                    status:
                        query.status,

                    online:
                        query.online,

                    pageSize:
                        query.pageSize,
                }}
            />

            {/* ====================================== */}
            {/* PAGINATION */}
            {/* ====================================== */}

            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">

                {/* PAGE SIZE */}

                <form
                    method="GET"
                    action="/customers"
                    className="flex items-center gap-2"
                >
                    {query.q && (
                        <input
                            type="hidden"
                            name="q"
                            value={
                                query.q
                            }
                        />
                    )}

                    {query.routerId && (
                        <input
                            type="hidden"
                            name="routerId"
                            value={
                                query.routerId
                            }
                        />
                    )}

                    {query.planId && (
                        <input
                            type="hidden"
                            name="planId"
                            value={
                                query.planId
                            }
                        />
                    )}

                    <input
                        type="hidden"
                        name="status"
                        value={
                            query.status
                        }
                    />

                    <input
                        type="hidden"
                        name="online"
                        value={
                            query.online
                        }
                    />

                    <input
                        type="hidden"
                        name="sort"
                        value={
                            query.sort
                        }
                    />

                    <input
                        type="hidden"
                        name="order"
                        value={
                            query.order
                        }
                    />

                    <input
                        type="hidden"
                        name="page"
                        value="1"
                    />

                    <span className="text-sm text-muted-foreground">
                        Baris
                    </span>

                    <select
                        name="pageSize"
                        defaultValue={
                            query.pageSize
                        }
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                    >
                        <option value="10">
                            10
                        </option>

                        <option value="20">
                            20
                        </option>

                        <option value="50">
                            50
                        </option>

                        <option value="100">
                            100
                        </option>
                    </select>

                    <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                    >
                        Terapkan
                    </Button>
                </form>

                {/* PAGE */}

                <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                        <Link
                            href={buildPageUrl(
                                currentPage -
                                1,
                            )}
                            className={buttonVariants({
                                variant:
                                    "outline",

                                size:
                                    "sm",
                            })}
                        >
                            Sebelumnya
                        </Link>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled
                        >
                            Sebelumnya
                        </Button>
                    )}

                    <span className="min-w-20 text-center text-sm">
                        {currentPage} /{" "}
                        {totalPages}
                    </span>

                    {currentPage <
                        totalPages ? (
                        <Link
                            href={buildPageUrl(
                                currentPage +
                                1,
                            )}
                            className={buttonVariants({
                                variant:
                                    "outline",

                                size:
                                    "sm",
                            })}
                        >
                            Berikutnya
                        </Link>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled
                        >
                            Berikutnya
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}