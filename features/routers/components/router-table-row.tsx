"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Circle,
    Eye,
    MoreHorizontal,
    Pencil,
    Trash2,
    Wifi,
    WifiOff,
} from "lucide-react";
import { DeactivateRouterDialog } from "@/features/routers/components/deactivate-router-dialog";
import { EditRouterDialog } from "@/features/routers/components/edit-router-dialog";
import { TestRouterConnectionButton } from "@/features/routers/components/test-router-connection-button";
import { Badge } from "@/components/ui/badge";
import {
    Button,
    buttonVariants,
} from "@/components/ui/button";
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

type ConnectionStatus =
    | "UNKNOWN"
    | "ONLINE"
    | "OFFLINE";

export type RouterTableRowData = {
    id: number;
    name: string;
    host: string;
    port: number;
    username: string;
    useHttps: boolean;
    description: string | null;
    isActive: boolean;
    connectionStatus: ConnectionStatus;
    lastConnectionCheckedAt: string | null;
    createdAt: string;
};

type RouterTableRowProps = {
    router: RouterTableRowData;
};

export function RouterTableRow({
    router,
}: RouterTableRowProps) {
    const [actionOpen, setActionOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deactivateOpen, setDeactivateOpen] = useState(false);

    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus>(
            router.connectionStatus,
        );

    function openActions() {
        setActionOpen(true);
    }

    function openEdit() {
        setActionOpen(false);

        setTimeout(() => {
            setEditOpen(true);
        }, 0);
    }

    function openDeactivate() {
        setActionOpen(false);

        setTimeout(() => {
            setDeactivateOpen(true);
        }, 0);
    }

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={openActions}
            >
                <TableCell>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="truncate font-medium">
                                {router.name}
                            </p>

                            <ConnectionStatusIcon
                                status={connectionStatus}
                            />
                        </div>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">
                            {router.host}:{router.port}
                        </p>

                        {router.description && (
                            <p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground">
                                {router.description}
                            </p>
                        )}
                    </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                    <span className="font-mono text-sm">
                        {router.host}:{router.port}
                    </span>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                    {router.username}
                </TableCell>

                <TableCell>
                    {router.isActive ? (
                        <Badge>
                            Aktif
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            Nonaktif
                        </Badge>
                    )}
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                    <ConnectionStatusLabel
                        status={connectionStatus}
                    />
                </TableCell>

                <TableCell className="hidden xl:table-cell">
                    {new Intl.DateTimeFormat(
                        "id-ID",
                        {
                            dateStyle: "medium",
                        },
                    ).format(
                        new Date(router.createdAt),
                    )}
                </TableCell>

                <TableCell className="w-12 text-right">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Aksi ${router.name}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            setActionOpen(true);
                        }}
                    >
                        <MoreHorizontal />
                    </Button>
                </TableCell>
            </TableRow>

            <Dialog
                open={actionOpen}
                onOpenChange={setActionOpen}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {router.name}
                        </DialogTitle>

                        <DialogDescription>
                            Pilih aksi yang ingin dilakukan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-muted-foreground">
                                Status koneksi
                            </span>

                            <ConnectionStatusLabel
                                status={connectionStatus}
                            />
                        </div>

                        {router.lastConnectionCheckedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Test terakhir:{" "}
                                {new Date(
                                    router.lastConnectionCheckedAt,
                                ).toLocaleString("id-ID")}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Link
                            href={`/routers/${router.id}`}
                            className={buttonVariants({
                                variant: "outline",
                            })}
                            onClick={() =>
                                setActionOpen(false)
                            }
                        >
                            <Eye />
                            Detail Router
                        </Link>

                        <TestRouterConnectionButton
                            routerId={router.id}
                            disabled={!router.isActive}
                            onResult={(success) =>
                                setConnectionStatus(
                                    success
                                        ? "ONLINE"
                                        : "OFFLINE",
                                )
                            }
                        />

                        <Button
                            type="button"
                            variant="outline"
                            onClick={openEdit}
                        >
                            <Pencil />
                            Edit Router
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={!router.isActive}
                            onClick={openDeactivate}
                        >
                            <Trash2 />
                            Hapus / Nonaktifkan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* EDIT BERDIRI SENDIRI, BUKAN DI DALAM DIALOG AKSI */}
            <EditRouterDialog
                router={{
                    id: router.id,
                    name: router.name,
                    host: router.host,
                    port: router.port,
                    username: router.username,
                    useHttps: router.useHttps,
                    description: router.description,
                }}
                open={editOpen}
                onOpenChange={setEditOpen}
                showTrigger={false}
            />

            <DeactivateRouterDialog
                router={{
                    id: router.id,
                    name: router.name,
                    isActive: router.isActive,
                }}
                open={deactivateOpen}
                onOpenChange={setDeactivateOpen}
                showTrigger={false}
            />
        </>
    );
}

function ConnectionStatusIcon({
    status,
}: {
    status: ConnectionStatus;
}) {
    if (status === "ONLINE") {
        return (
            <Wifi
                className="size-4 shrink-0 text-green-500"
                aria-label="Router online"
            />
        );
    }

    if (status === "OFFLINE") {
        return (
            <WifiOff
                className="size-4 shrink-0 text-destructive"
                aria-label="Router offline"
            />
        );
    }

    return (
        <Circle
            className="size-3 shrink-0 text-muted-foreground"
            aria-label="Belum diuji"
        />
    );
}

function ConnectionStatusLabel({
    status,
}: {
    status: ConnectionStatus;
}) {
    if (status === "ONLINE") {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500">
                <span className="size-2 rounded-full bg-green-500" />
                Online
            </span>
        );
    }

    if (status === "OFFLINE") {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                <span className="size-2 rounded-full bg-destructive" />
                Offline
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-muted-foreground" />
            Belum diuji
        </span>
    );
}