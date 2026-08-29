"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Ban,
    Clock3,
    MapPin,
    MoreHorizontal,
    Network,
    Package,
    PencilLine,
    Router,
    UserRound,
    Wifi,
    WifiOff,
    Eye,
    EyeOff,
    ShieldCheck
} from "lucide-react";

import {
    buttonVariants,
} from "@/components/ui/button";

import {
    cn,
} from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { IsolateCustomerDialog } from "@/features/customers/components/isolate-customer-dialog";
import { RestoreCustomerDialog } from "@/features/customers/components/restore-customer-dialog";

export type CustomerTableData = {
    id: number;
    name: string;
    phone: string | null;

    routerId: number;
    routerName: string;
    routerHost: string;

    internetPlanId: number;
    planName: string;
    bandwidthUpTo: string;
    planPrice: string;

    pppoeUsername: string;
    pppoePassword: string;
    pppProfileName: string;

    address: string | null;

    ipAddress: string | null;
    localAddress: string | null;
    remoteAddress: string | null;

    cpeBrand: string | null;
    ontSerialNumber: string | null;

    isOnline: boolean;
    uptime: string | null;
    lastCallerId: string | null;
    onuReceivePower: string | null;

    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";

    lastLoginAt: string | null;
    lastLogoutAt: string | null;

    detail: string | null;
    lastSyncedAt: string | null;
};

export type CustomerPlanOption = {
    id: number;
    name: string;
    routerId: number;
    pppProfileName: string;
    bandwidthUpTo: string;
    price: string;
};

type CustomerSort =
    | "name"
    | "pppoeUsername"
    | "status"
    | "createdAt"
    | "lastLoginAt"
    | "lastLogoutAt"
    | "lastSyncedAt";

type Props = {
    customers: CustomerTableData[];
    plans: CustomerPlanOption[];

    sort: CustomerSort;
    order:
    | "asc"
    | "desc";

    searchParams: {
        q?: string;
        routerId?: string;
        planId?: string;
        status?: string;
        online?: string;
        pageSize?: string;
    };
};

function formatRxPower(
    value: string | null,
) {
    if (!value) return "-";

    const power = Number(value);

    if (!Number.isFinite(power)) {
        return "-";
    }

    return `${power.toFixed(2)} dBm`;
}

export function CustomersTable({
    customers,
    plans,
    sort,
    order,
    searchParams,
}: Props) {
    function buildSortUrl(
        column: CustomerSort,
    ) {
        const params =
            new URLSearchParams();

        if (searchParams.q) {
            params.set(
                "q",
                searchParams.q,
            );
        }

        if (searchParams.routerId) {
            params.set(
                "routerId",
                searchParams.routerId,
            );
        }

        if (searchParams.planId) {
            params.set(
                "planId",
                searchParams.planId,
            );
        }

        if (
            searchParams.status &&
            searchParams.status !== "all"
        ) {
            params.set(
                "status",
                searchParams.status,
            );
        }

        if (
            searchParams.online &&
            searchParams.online !== "all"
        ) {
            params.set(
                "online",
                searchParams.online,
            );
        }

        if (searchParams.pageSize) {
            params.set(
                "pageSize",
                searchParams.pageSize,
            );
        }

        const nextOrder =
            sort === column &&
                order === "asc"
                ? "desc"
                : "asc";

        params.set(
            "sort",
            column,
        );

        params.set(
            "order",
            nextOrder,
        );

        /*
         * Setiap sorting kembali
         * ke halaman pertama.
         */
        params.set(
            "page",
            "1",
        );

        return `/customers?${params.toString()}`;
    }

    if (
        customers.length === 0
    ) {
        return (
            <div className="rounded-xl border bg-card px-6 py-14 text-center">
                <UserRound className="mx-auto mb-3 size-9 text-muted-foreground" />

                <p className="font-medium">
                    Customer tidak ditemukan
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                    Tidak ada Customer yang
                    sesuai dengan filter saat ini.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
                <Table className="min-w-[1050px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <SortHeader
                                    label="Customer"
                                    column="name"
                                    sort={sort}
                                    order={order}
                                    href={buildSortUrl(
                                        "name",
                                    )}
                                />
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                                Redaman
                            </TableHead>
                            <TableHead>
                                Phone
                            </TableHead>

                            <TableHead>
                                Paket
                            </TableHead>

                            <TableHead>
                                <SortHeader
                                    label="PPPoE User"
                                    column="pppoeUsername"
                                    sort={sort}
                                    order={order}
                                    href={buildSortUrl(
                                        "pppoeUsername",
                                    )}
                                />
                            </TableHead>

                            <TableHead>
                                PPPoE Password
                            </TableHead>

                            <TableHead>
                                IP Address
                            </TableHead>

                            <TableHead>
                                Router
                            </TableHead>

                            <TableHead>
                                Uptime
                            </TableHead>

                            <TableHead>
                                <SortHeader
                                    label="Status"
                                    column="status"
                                    sort={sort}
                                    order={order}
                                    href={buildSortUrl(
                                        "status",
                                    )}
                                />
                            </TableHead>

                            <TableHead className="w-[64px] text-right">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {customers.map(
                            (customer) => (
                                <CustomerRow
                                    key={
                                        customer.id
                                    }
                                    customer={
                                        customer
                                    }
                                    plans={plans}
                                />
                            ),
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function CustomerRow({
    customer,
    plans,
}: {
    customer: CustomerTableData;
    plans: CustomerPlanOption[];
}) {
    const [
        restoreOpen,
        setRestoreOpen,
    ] = useState(false);

    function openRestore() {
        setActionOpen(false);
        setRestoreOpen(true);
    }
    const [
        actionOpen,
        setActionOpen,
    ] = useState(false);

    const [
        editOpen,
        setEditOpen,
    ] = useState(false);

    const [
        isolateOpen,
        setIsolateOpen,
    ] = useState(false);


    function openEdit() {
        setActionOpen(false);
        setEditOpen(true);
    }

    function openIsolate() {
        setActionOpen(false);
        setIsolateOpen(true);
    }

    return (
        <>
            <TableRow
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() =>
                    setActionOpen(true)
                }
            >
                {/* CUSTOMER */}

                <TableCell>
                    <div className="flex items-center gap-3">
                        <div
                            className={
                                customer.isOnline
                                    ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600"
                                    : "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                            }
                        >
                            {customer.isOnline ? (
                                <Wifi className="size-4" />
                            ) : (
                                <WifiOff className="size-4" />
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {
                                    customer.name
                                }
                            </p>

                            <p
                                className={
                                    customer.isOnline
                                        ? "text-xs text-green-600"
                                        : "text-xs text-muted-foreground"
                                }
                            >
                                {customer.isOnline
                                    ? "Online"
                                    : "Offline"}
                            </p>
                        </div>
                    </div>
                </TableCell>

                <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {formatRxPower(
                        customer.onuReceivePower,
                    )}
                </TableCell>

                {/* PHONE */}

                <TableCell>
                    {customer.phone ??
                        "-"}
                </TableCell>

                {/* PACKAGE */}

                <TableCell>
                    <div>
                        <p className="font-medium">
                            {
                                customer.planName
                            }
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Up to{" "}
                            {
                                customer.bandwidthUpTo
                            }
                        </p>
                    </div>
                </TableCell>

                {/* PPPOE USER */}

                <TableCell>
                    <span className="font-mono text-sm">
                        {
                            customer.pppoeUsername
                        }
                    </span>
                </TableCell>

                <TableCell>
                    <PppoePasswordCell
                        password={
                            customer.pppoePassword
                        }
                    />
                </TableCell>

                {/* IP */}

                <TableCell>
                    <span className="font-mono text-sm">
                        {customer.ipAddress ??
                            "-"}
                    </span>
                </TableCell>

                {/* ROUTER */}

                <TableCell>
                    <div>
                        <p className="font-medium">
                            {
                                customer.routerName
                            }
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {
                                customer.routerHost
                            }
                        </p>
                    </div>
                </TableCell>

                {/* UPTIME */}

                <TableCell>
                    {customer.uptime ??
                        "-"}
                </TableCell>

                {/* STATUS */}

                <TableCell>
                    <CustomerStatusBadge
                        status={
                            customer.status
                        }
                    />
                </TableCell>

                {/* ACTION */}

                <TableCell className="text-right">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Aksi ${customer.name}`}
                        onClick={(
                            event,
                        ) => {
                            event.stopPropagation();

                            setActionOpen(
                                true,
                            );
                        }}
                    >
                        <MoreHorizontal className="size-5" />
                    </Button>
                </TableCell>
            </TableRow>

            {/* ====================================== */}
            {/* CUSTOMER ACTION / DETAIL DIALOG */}
            {/* ====================================== */}

            <Dialog
                open={actionOpen}
                onOpenChange={
                    setActionOpen
                }
            >
                <DialogContent className="max-h-[92svh] overflow-hidden p-0 sm:max-w-2xl">
                    <div className="flex max-h-[92svh] min-h-0 flex-col">

                        {/* HEADER */}

                        <div className="shrink-0 border-b px-5 py-5 sm:px-6">
                            <DialogHeader>
                                <div className="flex items-start gap-3 pr-7">
                                    <div
                                        className={
                                            customer.isOnline
                                                ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600"
                                                : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
                                        }
                                    >
                                        {customer.isOnline ? (
                                            <Wifi className="size-5" />
                                        ) : (
                                            <WifiOff className="size-5" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <DialogTitle className="truncate text-xl">
                                            {
                                                customer.name
                                            }
                                        </DialogTitle>

                                        <DialogDescription className="mt-1 flex flex-wrap items-center gap-2">
                                            <span className="font-mono">
                                                {
                                                    customer.pppoeUsername
                                                }
                                            </span>

                                            <span>
                                                •
                                            </span>

                                            <span>
                                                {
                                                    customer.routerName
                                                }
                                            </span>
                                        </DialogDescription>
                                    </div>

                                    <CustomerStatusBadge
                                        status={
                                            customer.status
                                        }
                                    />
                                </div>
                            </DialogHeader>
                        </div>

                        {/* ================================= */}
                        {/* ACTIONS - FIXED AT TOP */}
                        {/* ================================= */}

                        <div className="shrink-0 border-b bg-muted/30 px-5 py-4 sm:px-6">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Aksi Customer
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">

                                {/* EDIT */}

                                <Link
                                    href={`/customers/${customer.id}/edit`}
                                    className={cn(
                                        buttonVariants(),
                                        "h-auto justify-start gap-3 bg-blue-600 px-4 py-3 text-left text-white hover:bg-blue-700",
                                    )}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                        <PencilLine className="size-5" />
                                    </span>

                                    <span className="flex min-w-0 flex-col items-start">
                                        <span className="font-semibold">
                                            Edit Customer
                                        </span>

                                        <span className="text-xs font-normal text-blue-100">
                                            Buka halaman Edit Customer
                                        </span>
                                    </span>
                                </Link>

                                {/* ISOLATE */}

                                {customer.status ===
                                    "SUSPENDED" ? (
                                    <Button
                                        type="button"
                                        onClick={
                                            openRestore
                                        }
                                        className="h-auto justify-start gap-3 bg-green-600 px-4 py-3 text-left text-white hover:bg-green-700"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                            <ShieldCheck className="size-5" />
                                        </span>

                                        <span className="flex min-w-0 flex-col items-start">
                                            <span className="font-semibold">
                                                Buka Isolir
                                            </span>

                                            <span className="text-xs font-normal text-green-100">
                                                Kembalikan ke{" "}
                                                {
                                                    customer.pppProfileName
                                                }
                                            </span>
                                        </span>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={
                                            openIsolate
                                        }
                                        className="h-auto justify-start gap-3 px-4 py-3 text-left"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                            <Ban className="size-5" />
                                        </span>

                                        <span className="flex min-w-0 flex-col items-start">
                                            <span className="font-semibold">
                                                Isolir Customer
                                            </span>

                                            <span className="text-xs font-normal text-white/80">
                                                Ganti profile ke isolir
                                            </span>
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* ================================= */}
                        {/* SCROLLABLE CUSTOMER DETAIL */}
                        {/* ================================= */}

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                            <div className="space-y-6">

                                {/* INTERNET */}

                                <DetailSection
                                    icon={
                                        <Network className="size-4" />
                                    }
                                    title="Internet & PPPoE"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <DetailItem
                                            label="PPPoE User"
                                            value={
                                                customer.pppoeUsername
                                            }
                                            mono
                                        />

                                        <DetailItem
                                            label="Redaman"
                                            value={
                                                `${customer.onuReceivePower} dBm`
                                            }
                                        />

                                        <DetailPasswordItem
                                            label="PPPoE Password"
                                            password={
                                                customer.pppoePassword
                                            }
                                        />

                                        <DetailItem
                                            label="PPP Profile Database"
                                            value={
                                                customer.pppProfileName
                                            }
                                        />

                                        <DetailItem
                                            label="Paket Internet"
                                            value={
                                                customer.planName
                                            }
                                        />

                                        <DetailItem
                                            label="Bandwidth"
                                            value={
                                                customer.bandwidthUpTo
                                            }
                                        />
                                    </div>
                                </DetailSection>

                                {/* ROUTER */}

                                <DetailSection
                                    icon={
                                        <Router className="size-4" />
                                    }
                                    title="Router & Koneksi"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <DetailItem
                                            label="Router"
                                            value={
                                                customer.routerName
                                            }
                                        />

                                        <DetailItem
                                            label="Host Router"
                                            value={
                                                customer.routerHost
                                            }
                                            mono
                                        />

                                        <DetailItem
                                            label="IP Address"
                                            value={
                                                customer.ipAddress
                                            }
                                            mono
                                        />

                                        <DetailItem
                                            label="Local Address"
                                            value={
                                                customer.localAddress
                                            }
                                            mono
                                        />

                                        <DetailItem
                                            label="Remote Address"
                                            value={
                                                customer.remoteAddress
                                            }
                                            mono
                                        />

                                        <DetailItem
                                            label="Last Caller ID"
                                            value={
                                                customer.lastCallerId
                                            }
                                        />
                                    </div>
                                </DetailSection>

                                {/* SESSION */}

                                <DetailSection
                                    icon={
                                        <Clock3 className="size-4" />
                                    }
                                    title="Session PPPoE"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <DetailItem
                                            label="Status Koneksi"
                                            value={
                                                customer.isOnline
                                                    ? "Online"
                                                    : "Offline"
                                            }
                                        />

                                        <DetailItem
                                            label="Uptime"
                                            value={
                                                customer.uptime
                                            }
                                        />

                                        <DetailItem
                                            label="Last Login"
                                            value={
                                                formatDateTime(
                                                    customer.lastLoginAt,
                                                )
                                            }
                                        />

                                        <DetailItem
                                            label="Last Logout"
                                            value={
                                                formatDateTime(
                                                    customer.lastLogoutAt,
                                                )
                                            }
                                        />

                                        <DetailItem
                                            label="Last Sync"
                                            value={
                                                formatDateTime(
                                                    customer.lastSyncedAt,
                                                )
                                            }
                                        />
                                    </div>
                                </DetailSection>

                                {/* CUSTOMER */}

                                <DetailSection
                                    icon={
                                        <UserRound className="size-4" />
                                    }
                                    title="Data Customer"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <DetailItem
                                            label="Nama Customer"
                                            value={
                                                customer.name
                                            }
                                        />

                                        <DetailItem
                                            label="Phone"
                                            value={
                                                customer.phone
                                            }
                                        />

                                        <DetailItem
                                            label="Merek Router / ONT"
                                            value={
                                                customer.cpeBrand
                                            }
                                        />

                                        <DetailItem
                                            label="SN ONT"
                                            value={
                                                customer.ontSerialNumber
                                            }
                                        />
                                    </div>
                                </DetailSection>

                                {/* ADDRESS */}

                                <DetailSection
                                    icon={
                                        <MapPin className="size-4" />
                                    }
                                    title="Alamat"
                                >
                                    <DetailItem
                                        label="Alamat Customer"
                                        value={
                                            customer.address
                                        }
                                    />
                                </DetailSection>

                                {/* DETAIL */}

                                <DetailSection
                                    icon={
                                        <Package className="size-4" />
                                    }
                                    title="Catatan"
                                >
                                    <DetailItem
                                        label="Detail"
                                        value={
                                            customer.detail
                                        }
                                    />
                                </DetailSection>

                                <div className="h-2" />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* EDIT */}

            {/* ISOLATE */}

            <IsolateCustomerDialog
                customer={{
                    id:
                        customer.id,

                    name:
                        customer.name,

                    pppoeUsername:
                        customer.pppoeUsername,

                    routerName:
                        customer.routerName,
                }}
                open={
                    isolateOpen
                }
                onOpenChange={
                    setIsolateOpen
                }
            />

            <RestoreCustomerDialog
                customer={{
                    id:
                        customer.id,

                    name:
                        customer.name,

                    pppoeUsername:
                        customer.pppoeUsername,

                    routerName:
                        customer.routerName,

                    pppProfileName:
                        customer.pppProfileName,
                }}
                open={
                    restoreOpen
                }
                onOpenChange={
                    setRestoreOpen
                }
            />
        </>
    );
}

/* ============================================ */
/* SORT HEADER */
/* ============================================ */

function SortHeader({
    label,
    column,
    sort,
    order,
    href,
}: {
    label: string;
    column: CustomerSort;
    sort: CustomerSort;
    order:
    | "asc"
    | "desc";
    href: string;
}) {
    const active =
        sort === column;

    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-foreground transition-colors hover:text-primary"
        >
            {label}

            {!active ? (
                <ArrowUpDown className="size-3.5 text-muted-foreground" />
            ) : order ===
                "asc" ? (
                <ArrowUp className="size-3.5 text-primary" />
            ) : (
                <ArrowDown className="size-3.5 text-primary" />
            )}
        </Link>
    );
}

/* ============================================ */
/* STATUS */
/* ============================================ */

function CustomerStatusBadge({
    status,
}: {
    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
}) {
    if (
        status === "ACTIVE"
    ) {
        return (
            <Badge
                variant="outline"
                className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
            >
                Aktif
            </Badge>
        );
    }

    if (
        status ===
        "SUSPENDED"
    ) {
        return (
            <Badge variant="destructive">
                Suspend
            </Badge>
        );
    }

    return (
        <Badge variant="secondary">
            Nonaktif
        </Badge>
    );
}

/* ============================================ */
/* DETAIL SECTION */
/* ============================================ */

function DetailSection({
    icon,
    title,
    children,
}: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
                <span className="text-muted-foreground">
                    {icon}
                </span>

                <h3 className="text-sm font-semibold">
                    {title}
                </h3>
            </div>

            {children}
        </section>
    );
}

/* ============================================ */
/* DETAIL ITEM */
/* ============================================ */

function DetailItem({
    label,
    value,
    mono = false,
}: {
    label: string;
    value:
    | string
    | null
    | undefined;
    mono?: boolean;
}) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-1 text-xs text-muted-foreground">
                {label}
            </p>

            <p
                className={
                    mono
                        ? "break-all font-mono text-sm font-medium"
                        : "break-words text-sm font-medium"
                }
            >
                {value || "-"}
            </p>
        </div>
    );
}

/* ============================================ */
/* DATE FORMAT */
/* ============================================ */

function formatDateTime(
    value:
        | string
        | null
        | undefined,
) {
    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short",
        },
    ).format(date);
}

function PppoePasswordCell({
    password,
}: {
    password: string;
}) {
    const [
        visible,
        setVisible,
    ] = useState(false);

    return (
        <div className="flex items-center gap-1">
            <span className="max-w-[150px] truncate font-mono text-sm">
                {visible
                    ? password
                    : "••••••••"}
            </span>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={
                    visible
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                }
                onClick={(event) => {
                    event.stopPropagation();
                    setVisible(
                        (current) =>
                            !current,
                    );
                }}
            >
                {visible ? (
                    <EyeOff className="size-3.5" />
                ) : (
                    <Eye className="size-3.5" />
                )}
            </Button>
        </div>
    );
}

function DetailPasswordItem({
    label,
    password,
}: {
    label: string;
    password: string;
}) {
    const [
        visible,
        setVisible,
    ] = useState(false);

    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-1 text-xs text-muted-foreground">
                {label}
            </p>

            <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 break-all font-mono text-sm font-medium">
                    {visible
                        ? password
                        : "••••••••"}
                </p>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label={
                        visible
                            ? "Sembunyikan password"
                            : "Tampilkan password"
                    }
                    onClick={() =>
                        setVisible(
                            (current) =>
                                !current,
                        )
                    }
                >
                    {visible ? (
                        <EyeOff className="size-3.5" />
                    ) : (
                        <Eye className="size-3.5" />
                    )}
                </Button>
            </div>
        </div>
    );
}