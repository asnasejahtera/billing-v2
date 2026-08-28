import Link from "next/link";

import { EditRouterDialog } from "@/features/routers/components/edit-router-dialog";
import { CreateRouterDialog } from "@/features/routers/components/create-router-dialog";
import { DeactivateRouterDialog } from "@/features/routers/components/deactivate-router-dialog";
import { TestRouterConnectionButton } from "@/features/routers/components/test-router-connection-button";
import { listRoutersService } from "@/features/routers/services/router.service";
import type { RouterListSearchParams } from "@/features/routers/schemas/router-list.schema";
import { RouterTableRow } from "@/features/routers/components/router-table-row";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

import {
    ArrowUpDown,
    Eye,
    Router,
    Search,
} from "lucide-react";

type RoutersPageProps = {
    searchParams: Promise<RouterListSearchParams>;
};

export default async function RoutersPage({
    searchParams,
}: RoutersPageProps) {
    const params = await searchParams;
    const result =
        await listRoutersService(params);

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Router
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola MikroTik router yang terhubung
                        dengan aplikasi.
                    </p>
                </div>

                <CreateRouterDialog />
            </div>

            <RouterToolbar result={result} />

            <div className="overflow-hidden rounded-lg border bg-background">
                {result.data.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                            <Router className="size-5 text-muted-foreground" />
                        </div>

                        <p className="font-medium">
                            Router tidak ditemukan
                        </p>

                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Tambahkan router baru atau ubah
                            pencarian dan filter yang digunakan.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHead
                                        label="Nama"
                                        field="name"
                                        result={result}
                                    />

                                    <SortableHead
                                        label="Host"
                                        field="host"
                                        result={result}
                                        className="hidden sm:table-cell"
                                    />

                                    <TableHead className="hidden md:table-cell">
                                        Username
                                    </TableHead>

                                    <TableHead>
                                        Status
                                    </TableHead>

                                    <TableHead className="hidden lg:table-cell">
                                        Koneksi
                                    </TableHead>

                                    <SortableHead
                                        label="Dibuat"
                                        field="createdAt"
                                        result={result}
                                        className="hidden xl:table-cell"
                                    />

                                    <TableHead className="w-10">
                                        <span className="sr-only">
                                            Aksi
                                        </span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {result.data.map((router) => (
                                    <RouterTableRow
                                        key={router.id}
                                        router={{
                                            id: router.id,
                                            name: router.name,
                                            host: router.host,
                                            port: router.port,
                                            username: router.username,
                                            useHttps: router.useHttps,
                                            description:
                                                router.description,
                                            isActive:
                                                router.isActive,
                                            connectionStatus:
                                                router.connectionStatus,
                                            lastConnectionCheckedAt:
                                                router.lastConnectionCheckedAt
                                                    ?.toISOString() ??
                                                null,
                                            createdAt:
                                                router.createdAt.toISOString(),
                                        }}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <RouterPagination result={result} />
        </div>
    );
}

type RouterResult = Awaited<
    ReturnType<typeof listRoutersService>
>;

function RouterToolbar({
    result,
}: {
    result: RouterResult;
}) {
    return (
        <form
            action="/routers"
            method="get"
            className="flex flex-col gap-3 rounded-lg border bg-background p-3 lg:flex-row lg:items-center"
        >
            <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    name="q"
                    defaultValue={result.q}
                    placeholder="Cari nama, IP, atau username..."
                    className="pl-9"
                />
            </div>

            <select
                name="status"
                defaultValue={result.status}
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <option value="all">
                    Semua status
                </option>
                <option value="active">
                    Aktif
                </option>
                <option value="inactive">
                    Nonaktif
                </option>
            </select>

            <select
                name="pageSize"
                defaultValue={String(result.pageSize)}
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            <div className="flex gap-2">
                <Button
                    type="submit"
                    variant="secondary"
                    className="flex-1 lg:flex-none"
                >
                    <Search />
                    Terapkan
                </Button>

                <Link
                    href="/routers"
                    className={cn(
                        buttonVariants({
                            variant: "outline",
                        }),
                        "flex-1 lg:flex-none",
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
    | "host"
    | "createdAt";
    result: RouterResult;
    className?: string;
}) {
    const active =
        result.sort === field;

    const nextOrder =
        active &&
            result.order === "asc"
            ? "desc"
            : "asc";

    return (
        <TableHead className={className}>
            <Link
                href={buildRouterUrl(result, {
                    sort: field,
                    order: nextOrder,
                    page: 1,
                })}
                className="inline-flex items-center gap-1 hover:text-foreground"
            >
                {label}
                <ArrowUpDown className="size-3.5" />
            </Link>
        </TableHead>
    );
}

function RouterPagination({
    result,
}: {
    result: RouterResult;
}) {
    const from =
        result.total === 0
            ? 0
            : (result.page - 1) *
            result.pageSize +
            1;

    const to = Math.min(
        result.page * result.pageSize,
        result.total,
    );

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {from}-{to} dari {result.total} router
            </p>

            <div className="flex items-center gap-2">
                {result.page > 1 ? (
                    <Link
                        href={buildRouterUrl(result, {
                            page: result.page - 1,
                        })}
                        className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                        })}
                    >
                        Sebelumnya
                    </Link>
                ) : (
                    <span
                        className={cn(
                            buttonVariants({
                                variant: "outline",
                                size: "sm",
                            }),
                            "pointer-events-none opacity-50",
                        )}
                    >
                        Sebelumnya
                    </span>
                )}

                <span className="min-w-20 text-center text-sm">
                    {result.page} / {result.totalPages}
                </span>

                {result.page <
                    result.totalPages ? (
                    <Link
                        href={buildRouterUrl(result, {
                            page: result.page + 1,
                        })}
                        className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                        })}
                    >
                        Berikutnya
                    </Link>
                ) : (
                    <span
                        className={cn(
                            buttonVariants({
                                variant: "outline",
                                size: "sm",
                            }),
                            "pointer-events-none opacity-50",
                        )}
                    >
                        Berikutnya
                    </span>
                )}
            </div>
        </div>
    );
}

function buildRouterUrl(
    result: RouterResult,
    changes: Partial<{
        q: string;
        status:
        | "all"
        | "active"
        | "inactive";
        page: number;
        pageSize: number;
        sort:
        | "name"
        | "host"
        | "createdAt";
        order: "asc" | "desc";
    }>,
) {
    const query = {
        q: result.q,
        status: result.status,
        page: result.page,
        pageSize: result.pageSize,
        sort: result.sort,
        order: result.order,
        ...changes,
    };

    const params =
        new URLSearchParams();

    if (query.q) {
        params.set("q", query.q);
    }

    if (query.status !== "all") {
        params.set(
            "status",
            query.status,
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

    params.set("sort", query.sort);
    params.set("order", query.order);

    return `/routers?${params.toString()}`;
}