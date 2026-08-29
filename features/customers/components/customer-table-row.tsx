"use client";

import {
    useState,
} from "react";
import {
    Eye,
    EyeOff,
    MoreHorizontal,
    Wifi,
    WifiOff,
} from "lucide-react";
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
    TableCell,
    TableRow,
} from "@/components/ui/table";

import {
    EditCustomerDialog,
} from "@/features/customers/components/edit-customer-dialog";
import type { CustomerColumnId } from "@/features/customers/config/customer-table-columns";
import {
    Pencil,
} from "lucide-react";

export type CustomerTableRowData = {
    id: number;
    name: string;
    phone: string | null;

    planName: string;
    bandwidthUpTo: string;
    planPrice: string;

    routerName: string;
    routerHost: string;

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

    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";

    lastLoginAt: string | null;
    lastLogoutAt: string | null;

    detail: string | null;

    lastSyncedAt: string | null;

    internetPlanId: number;
    routerId: number;
};



type CustomerPlanOption = {
    id: number;
    name: string;
    routerId: number;
    pppProfileName: string;
    bandwidthUpTo: string;
    price: string;
};


export function CustomerTableRow({
    customer,
    columns,
}: {
    customer: CustomerTableRowData;
    columns: CustomerColumnId[];
}) {

    const [
        editOpen,
        setEditOpen,
    ] = useState(false);

    const [
        dialogOpen,
        setDialogOpen,
    ] = useState(false);

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                    setDialogOpen(true)
                }
            >
                {columns.map((column) => (
                    <CustomerCell
                        key={column}
                        column={column}
                        customer={customer}
                    />
                ))}
                <TableCell className="w-12 text-right">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Aksi ${customer.name}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            setDialogOpen(true);
                        }}
                    >
                        <MoreHorizontal />
                    </Button>
                </TableCell>
            </TableRow>

            <Dialog
                open={dialogOpen}
                onOpenChange={
                    setDialogOpen
                }
            >
                <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {customer.name}
                        </DialogTitle>

                        <DialogDescription>
                            Informasi Customer dan
                            koneksi PPPoE.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-wrap items-center gap-2">
                        <CustomerStatusBadge
                            status={
                                customer.status
                            }
                        />

                        {customer.isOnline ? (
                            <Badge variant="outline">
                                <Wifi className="text-green-500" />
                                PPPoE Online
                            </Badge>
                        ) : (
                            <Badge variant="outline">
                                <WifiOff />
                                PPPoE Offline
                            </Badge>
                        )}
                    </div>

                    <Section
                        title="Customer"
                        rows={[
                            [
                                "Nama Customer",
                                customer.name,
                            ],
                            [
                                "Nama Customer",
                                customer.name,
                            ],
                            [
                                "Phone",
                                customer.phone,
                            ],
                            [
                                "Alamat",
                                customer.address,
                            ],
                            [
                                "Paket",
                                customer.planName,
                            ],
                            [
                                "Bandwidth Up To",
                                customer.bandwidthUpTo,
                            ],
                            [
                                "Harga",
                                formatCurrency(
                                    customer.planPrice,
                                ),
                            ],
                            [
                                "Router",
                                `${customer.routerName} · ${customer.routerHost}`,
                            ],
                            [
                                "Merek Router",
                                customer.cpeBrand,
                            ],
                            [
                                "SN ONT",
                                customer.ontSerialNumber,
                            ],
                            [
                                "Detail",
                                customer.detail,
                            ],
                        ]}
                    />

                    <div className="rounded-lg border">
                        <div className="border-b px-4 py-3">
                            <p className="font-medium">
                                PPPoE
                            </p>
                        </div>

                        <div className="divide-y">
                            <DetailRow
                                label="PPPoE User"
                                value={
                                    customer.pppoeUsername
                                }
                            />

                            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
                                <span className="text-sm text-muted-foreground">
                                    PPPoE Password
                                </span>

                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="min-w-0 flex-1 truncate font-mono text-sm">
                                        {showPassword
                                            ? customer.pppoePassword
                                            : "••••••••"}
                                    </span>

                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        aria-label={
                                            showPassword
                                                ? "Sembunyikan password"
                                                : "Tampilkan password"
                                        }
                                        onClick={() =>
                                            setShowPassword(
                                                (value) =>
                                                    !value,
                                            )
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff />
                                        ) : (
                                            <Eye />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <DetailRow
                                label="PPP Profile"
                                value={
                                    customer.pppProfileName
                                }
                            />

                            <DetailRow
                                label="IP Address"
                                value={
                                    customer.ipAddress
                                }
                            />

                            <DetailRow
                                label="Local Address"
                                value={
                                    customer.localAddress
                                }
                            />

                            <DetailRow
                                label="Remote Address"
                                value={
                                    customer.remoteAddress
                                }
                            />

                            <DetailRow
                                label="Uptime"
                                value={
                                    customer.isOnline
                                        ? customer.uptime
                                        : null
                                }
                            />

                            <DetailRow
                                label="Last Caller ID"
                                value={
                                    customer.lastCallerId
                                }
                            />

                            <DetailRow
                                label="Last Login"
                                value={formatDate(
                                    customer.lastLoginAt,
                                )}
                            />

                            <DetailRow
                                label="Last Logout"
                                value={formatDate(
                                    customer.lastLogoutAt,
                                )}
                            />

                            <DetailRow
                                label="Last Sync"
                                value={formatDate(
                                    customer.lastSyncedAt,
                                )}
                            />
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setDialogOpen(false);

                                        setTimeout(() => {
                                            setEditOpen(true);
                                        }, 0);
                                    }}
                                >
                                    <Pencil />
                                    Edit Customer
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Section({
    title,
    rows,
}: {
    title: string;
    rows: Array<
        [
            string,
            string | null,
        ]
    >;
}) {
    return (
        <div className="rounded-lg border">
            <div className="border-b px-4 py-3">
                <p className="font-medium">
                    {title}
                </p>
            </div>

            <div className="divide-y">
                {rows.map(
                    ([label, value]) => (
                        <DetailRow
                            key={label}
                            label={label}
                            value={value}
                        />
                    ),
                )}
            </div>
        </div>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value:
    | string
    | null
    | undefined;
}) {
    return (
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
            <span className="text-sm text-muted-foreground">
                {label}
            </span>

            <span className="break-words text-sm font-medium">
                {value || "-"}
            </span>
        </div>
    );
}

function CustomerStatusBadge({
    status,
}: {
    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
}) {
    if (status === "ACTIVE") {
        return (
            <Badge>
                Aktif
            </Badge>
        );
    }

    if (
        status === "SUSPENDED"
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

function formatDate(
    value: string | null,
) {
    if (!value) return null;

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            dateStyle: "medium",
            timeStyle: "medium",
        },
    ).format(
        new Date(value),
    );
}

function formatCurrency(
    value: string,
) {
    const amount =
        Number(value);

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        },
    ).format(
        Number.isFinite(amount)
            ? amount
            : 0,
    );
}

function CustomerCell({
    column,
    customer,
}: {
    column: CustomerColumnId;
    customer: CustomerTableRowData;
}) {
    switch (column) {
        case "name":
            return (
                <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        {customer.isOnline ? (
                            <Wifi
                                className="size-4 text-green-500"
                                aria-label="Online"
                            />
                        ) : (
                            <WifiOff
                                className="size-4 text-muted-foreground"
                                aria-label="Offline"
                            />
                        )}

                        <span className="font-medium">
                            {customer.name}
                        </span>
                    </div>
                </TableCell>
            );

        case "phone":
            return (
                <TableCell className="whitespace-nowrap">
                    {customer.phone ?? "-"}
                </TableCell>
            );

        case "plan":
            return (
                <TableCell className="whitespace-nowrap">
                    {customer.planName}
                </TableCell>
            );

        case "bandwidthUpTo":
            return (
                <TableCell className="whitespace-nowrap">
                    {customer.bandwidthUpTo}
                </TableCell>
            );

        case "pppoeUsername":
            return (
                <TableCell className="whitespace-nowrap font-mono text-sm">
                    {customer.pppoeUsername}
                </TableCell>
            );

        case "pppoePassword":
            return (
                <TableCell className="whitespace-nowrap font-mono">
                    ••••••••
                </TableCell>
            );

        case "address":
            return (
                <TableCell className="min-w-52">
                    {customer.address ?? "-"}
                </TableCell>
            );

        case "ipAddress":
            return (
                <TableCell className="whitespace-nowrap font-mono text-sm">
                    {customer.ipAddress ?? "-"}
                </TableCell>
            );

        case "localAddress":
            return (
                <TableCell className="whitespace-nowrap font-mono text-sm">
                    {customer.localAddress ?? "-"}
                </TableCell>
            );

        case "remoteAddress":
            return (
                <TableCell className="whitespace-nowrap font-mono text-sm">
                    {customer.remoteAddress ?? "-"}
                </TableCell>
            );

        case "router":
            return (
                <TableCell className="whitespace-nowrap">
                    {customer.routerName}
                </TableCell>
            );

        case "cpeBrand":
            return (
                <TableCell className="whitespace-nowrap">
                    {customer.cpeBrand ?? "-"}
                </TableCell>
            );

        case "ontSerialNumber":
            return (
                <TableCell className="whitespace-nowrap font-mono">
                    {customer.ontSerialNumber ?? "-"}
                </TableCell>
            );

        case "uptime":
            return (
                <TableCell className="whitespace-nowrap">
                    {customer.isOnline
                        ? customer.uptime ?? "-"
                        : "-"}
                </TableCell>
            );

        case "lastCallerId":
            return (
                <TableCell className="whitespace-nowrap font-mono text-sm">
                    {customer.lastCallerId ?? "-"}
                </TableCell>
            );

        case "status":
            return (
                <TableCell className="whitespace-nowrap">
                    <CustomerStatusBadge
                        status={customer.status}
                    />
                </TableCell>
            );

        case "lastLoginAt":
            return (
                <TableCell className="whitespace-nowrap">
                    {formatDate(
                        customer.lastLoginAt,
                    ) ?? "-"}
                </TableCell>
            );

        case "lastLogoutAt":
            return (
                <TableCell className="whitespace-nowrap">
                    {formatDate(
                        customer.lastLogoutAt,
                    ) ?? "-"}
                </TableCell>
            );
    }
}