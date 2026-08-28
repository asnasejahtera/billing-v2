"use client";

import {
    useState,
} from "react";
import {
    MoreHorizontal,
    Pencil,
} from "lucide-react";
import { EditInternetPlanDialog } from "@/features/internet-plans/components/edit-internet-plan-dialog";
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

export type InternetPlanRowData = {
    id: number;
    name: string;
    price: string;
    pppProfileName: string;
    bandwidthUpTo: string;
    rateLimit: string | null;
    onlyOne:
    | "yes"
    | "no"
    | "default";
    status: string
    routerName: string;
    routerHost: string;
    ipPool: string | null;
    localAddress: string | null;
    lastSyncedAt:
    | string
    | null;
};

export function InternetPlanRow({
    plan,
}: {
    plan: InternetPlanRowData;
}) {
    const [
        actionOpen,
        setActionOpen,
    ] = useState(false);

    const [
        editOpen,
        setEditOpen,
    ] = useState(false);

    function openEdit() {
        setActionOpen(false);

        setTimeout(() => {
            setEditOpen(true);
        }, 0);
    }

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                    setActionOpen(true)
                }
            >
                <TableCell>
                    <div className="min-w-0">
                        <p className="font-medium">
                            {plan.name}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
                            {
                                plan.pppProfileName
                            }
                            {" · "}
                            {
                                plan.bandwidthUpTo
                            }
                        </p>
                    </div>
                </TableCell>

                <TableCell className="font-medium">
                    {formatCurrency(
                        plan.price,
                    )}
                </TableCell>

                <TableCell className="hidden font-mono text-sm md:table-cell">
                    {plan.pppProfileName}
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                    {plan.bandwidthUpTo}
                </TableCell>

                <TableCell className="hidden font-mono text-sm lg:table-cell">
                    {plan.rateLimit ?? "-"}
                </TableCell>

                <TableCell className="hidden xl:table-cell">
                    {plan.ipPool ?? "-"}
                </TableCell>

                <TableCell className="hidden xl:table-cell">
                    {plan.localAddress ??
                        "-"}
                </TableCell>

                <TableCell className="hidden 2xl:table-cell">
                    {formatOnlyOne(
                        plan.onlyOne,
                    )}
                </TableCell>

                <TableCell>
                    <div>
                        <p className="text-sm font-medium">
                            {plan.routerName}
                        </p>

                        <p className="hidden text-xs text-muted-foreground sm:block">
                            {plan.routerHost}
                        </p>
                    </div>
                </TableCell>

                <TableCell>
                    {plan.status ===
                        "ACTIVE" ? (
                        <Badge>
                            Aktif
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            Nonaktif
                        </Badge>
                    )}
                </TableCell>

                <TableCell className="hidden text-sm text-muted-foreground 2xl:table-cell">
                    {plan.lastSyncedAt
                        ? new Date(
                            plan.lastSyncedAt,
                        ).toLocaleString(
                            "id-ID",
                        )
                        : "-"}
                </TableCell>

                <TableCell className="w-12 text-right">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Aksi ${plan.name}`}
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
                onOpenChange={
                    setActionOpen
                }
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {plan.name}
                        </DialogTitle>

                        <DialogDescription>
                            Pilih aksi Paket Internet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={openEdit}
                        >
                            <Pencil />
                            Edit Paket
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <EditInternetPlanDialog
                plan={{
                    id: plan.id,
                    name: plan.name,
                    price: plan.price,
                }}
                open={editOpen}
                onOpenChange={
                    setEditOpen
                }
            />
        </>
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