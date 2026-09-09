"use client";

import { Loader2, Network, Plus, Clock, Unplug } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createFiberCoreConnectionAction } from "../actions/create-fiber-core-connection.action";
import { getFiberConnectionManagerAction } from "../actions/get-fiber-connection-manager.action";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { releaseFiberCoreConnectionAction } from "../actions/release-fiber-core-connection.action";
import type {
    NetworkMapFiberConnectionDto,
    NetworkMapFiberConnectionManagerDto,
    NetworkMapNodePortSummaryUpdate
} from "../types/network-map-persistence.types";
import { getNetworkMapPortSummariesAction } from "../actions/get-network-map-port-summaries.action";


type FiberCoreConnectionDialogProps = {
    open: boolean;
    linkId: number | null;
    onOpenChange: (open: boolean) => void;
    onPortSummaryChange: (updates: NetworkMapNodePortSummaryUpdate[]) => void;
};

export function FiberCoreConnectionDialog({
    open, linkId, onOpenChange, onPortSummaryChange,
}: FiberCoreConnectionDialogProps) {
    const [data, setData] = useState<NetworkMapFiberConnectionManagerDto | null>(null);
    const [coreId, setCoreId] = useState("");
    const [sourcePortId, setSourcePortId] = useState("");
    const [targetPortId, setTargetPortId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, startTransition] = useTransition();
    const [pendingRelease, setPendingRelease] = useState<NetworkMapFiberConnectionDto | null>(null);
    const [isReleasing, setIsReleasing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    async function loadData(currentLinkId: number) {
        setIsLoading(true);
        setError(null);
        const result = await getFiberConnectionManagerAction({ linkId: currentLinkId });
        if (!result.success) {
            setError(result.message);
            setIsLoading(false);
            return;
        }
        setData(result.data);
        setIsLoading(false);
    }

    /*
    * =========================
    * SYNC RUNTIME PORT SUMMARY
    * =========================
    */
    async function syncPortSummary() {
        if (!data) return;

        const result = await getNetworkMapPortSummariesAction({
            nodeIds: [
                data.sourceNodeId,
                data.targetNodeId,
            ],
        });

        if (result.success)
            onPortSummaryChange(result.data);
    }

    const coreItems = (data?.cores ?? []).map((core) => ({
        value: String(core.id),
        label: `Core ${core.coreNumber}${core.color ? ` · ${core.color}` : ""}`,
    }));
    const sourcePortItems = (data?.sourcePorts ?? []).map((port) => ({
        value: String(port.id),
        label: `${port.name} · ${port.portType}`,
    }));
    const targetPortItems = (data?.targetPorts ?? []).map((port) => ({
        value: String(port.id),
        label: `${port.name} · ${port.portType}`,
    }));

    /*
     * =========================
     * RELEASE CONNECTION
     * =========================
     */
    async function handleRelease() {
        if (!pendingRelease || isReleasing || !linkId) return;

        setIsReleasing(true);
        setError(null);
        setMessage(null);

        const result = await releaseFiberCoreConnectionAction({
            id: pendingRelease.id,
        });

        if (!result.success) {
            setError(result.message);
            setIsReleasing(false);
            return;
        }

        setPendingRelease(null);
        setMessage(result.message);
        await Promise.all([
            loadData(linkId),
            syncPortSummary(),
        ]);
        setIsReleasing(false);
    }

    useEffect(() => {
        if (!open || !linkId) return;
        setCoreId("");
        setSourcePortId("");
        setTargetPortId("");
        void loadData(linkId);
    }, [open, linkId]);

    function handleCreate() {
        if (!linkId || !coreId || !sourcePortId || !targetPortId || isSaving) return;

        startTransition(async () => {
            setError(null);

            const result = await createFiberCoreConnectionAction({
                linkId,
                coreId: Number(coreId),
                sourcePortId: Number(sourcePortId),
                targetPortId: Number(targetPortId),
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            setCoreId("");
            setSourcePortId("");
            setTargetPortId("");

            await Promise.all([
                loadData(linkId),
                syncPortSummary(),
            ]);
        });
    }

    const canCreate =
        !!coreId &&
        !!sourcePortId &&
        !!targetPortId &&
        !isSaving;

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    if (isSaving || isReleasing) return;
                    onOpenChange(nextOpen);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Kelola Fiber Core</DialogTitle>
                        <DialogDescription>
                            Hubungkan core kabel dengan port fisik source dan target.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex min-h-40 items-center justify-center">
                            <Loader2 className="size-5 animate-spin" />
                        </div>
                    ) : data ? (
                        <div className="space-y-5">
                            {/* CREATE CONNECTION */}
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <Plus className="size-4" />
                                    <p className="font-medium">Tambah Connection</p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Fiber Core</Label>
                                        <Select
                                            items={coreItems}
                                            value={coreId}
                                            onValueChange={(value) => setCoreId(value ?? "")}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih core" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {coreItems.map((item) => (
                                                    <SelectItem key={item.value} value={item.value}>
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Source Port</Label>
                                        <Select items={sourcePortItems} value={sourcePortId} onValueChange={() => setSourcePortId}>
                                            <Select
                                                items={sourcePortItems}
                                                value={sourcePortId}
                                                onValueChange={(value) => setSourcePortId(value ?? "")}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih source port" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sourcePortItems.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>
                                                            {item.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Target Port</Label>
                                        <Select
                                            items={targetPortItems}
                                            value={targetPortId}
                                            onValueChange={(value) => setTargetPortId(value ?? "")}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih target port" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {targetPortItems.map((item) => (
                                                    <SelectItem key={item.value} value={item.value}>
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    disabled={!canCreate}
                                    onClick={handleCreate}
                                >
                                    {isSaving ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Plus className="size-4" />
                                    )}
                                    {isSaving ? "Menyimpan..." : "Hubungkan Core"}
                                </Button>
                            </div>

                            {/* ACTIVE CONNECTIONS */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Network className="size-4" />
                                    <p className="font-medium">
                                        Connection Aktif ({data.connections.length})
                                    </p>
                                </div>

                                {data.connections.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        Belum ada core yang terhubung.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.connections.map((connection) => (
                                            <div key={connection.id} className="space-y-3 rounded-lg border p-3">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium">
                                                            Core {connection.coreNumber}
                                                            {connection.coreColor ? ` · ${connection.coreColor}` : ""}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {connection.sourcePortName} → {connection.targetPortName}
                                                        </p>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="size-3" />
                                                            {new Date(connection.connectedAt).toLocaleString("id-ID")}
                                                        </div>
                                                        {connection.description && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {connection.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-emerald-600">ACTIVE</span>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setPendingRelease(connection)}
                                                        >
                                                            <Unplug className="size-4" />
                                                            Release
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {message && (
                                <div className="rounded-md border px-3 py-2 text-sm">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSaving}
                            onClick={() => onOpenChange(false)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={pendingRelease !== null}
                onOpenChange={(nextOpen) => {
                    if (isReleasing) return;
                    if (!nextOpen) setPendingRelease(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Release fiber core?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Core {pendingRelease?.coreNumber} pada koneksi{" "}
                            {pendingRelease?.sourcePortName} → {pendingRelease?.targetPortName}{" "}
                            akan dilepas. History connection tetap disimpan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isReleasing}>
                            Batal
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isReleasing || !pendingRelease}
                            onClick={() => void handleRelease()}
                        >
                            {isReleasing
                                ? <Loader2 className="size-4 animate-spin" />
                                : <Unplug className="size-4" />}
                            {isReleasing ? "Melepas..." : "Release"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}