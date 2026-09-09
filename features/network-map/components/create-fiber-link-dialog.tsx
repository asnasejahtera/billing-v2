"use client";

import {
    Loader2,
    Route,
} from "lucide-react";
import {
    useEffect,
    useState,
    useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNetworkTopologyLinkAction } from "../actions/create-network-topology-link.action";
import type {
    NetworkMapLinkDraft,
    NetworkMapLinkDto,
} from "../types/network-map-persistence.types";

type CreateFiberLinkDialogProps = {
    open: boolean;
    draft: NetworkMapLinkDraft | null;
    onOpenChange: (open: boolean) => void;
    onCreated: (link: NetworkMapLinkDto) => void;
};

export function CreateFiberLinkDialog({
    open,
    draft,
    onOpenChange,
    onCreated,
}: CreateFiberLinkDialogProps) {
    const [isPending, startTransition] =
        useTransition();

    const [cableName, setCableName] =
        useState("");
    const [cableType, setCableType] =
        useState("");
    const [fiberType, setFiberType] =
        useState("");
    const [coreCount, setCoreCount] =
        useState("12");
    const [
        actualLengthMeters,
        setActualLengthMeters,
    ] = useState("");
    const [
        attenuationDbPerKm,
        setAttenuationDbPerKm,
    ] = useState("0.35");
    const [description, setDescription] =
        useState("");
    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        if (!draft) return;

        setCableName(
            `FO-${draft.sourceCode}-${draft.targetCode}`,
        );
        setCableType("");
        setFiberType("");
        setCoreCount("12");
        setActualLengthMeters("");
        setAttenuationDbPerKm("0.35");
        setDescription("");
        setError(null);
    }, [draft]);

    function handleSubmit() {
        if (!draft || isPending) return;

        const parsedCoreCount =
            Number(coreCount);

        if (
            !Number.isInteger(parsedCoreCount) ||
            parsedCoreCount < 1
        ) {
            setError(
                "Jumlah core harus berupa angka minimal 1.",
            );
            return;
        }

        const actualLength =
            actualLengthMeters.trim()
                ? Number(actualLengthMeters)
                : null;

        const attenuation =
            attenuationDbPerKm.trim()
                ? Number(attenuationDbPerKm)
                : null;

        if (
            actualLength !== null &&
            (!Number.isFinite(actualLength) ||
                actualLength <= 0)
        ) {
            setError(
                "Panjang aktual tidak valid.",
            );
            return;
        }

        if (
            attenuation !== null &&
            (!Number.isFinite(attenuation) ||
                attenuation < 0)
        ) {
            setError(
                "Redaman per km tidak valid.",
            );
            return;
        }

        startTransition(async () => {
            setError(null);

            const result =
                await createNetworkTopologyLinkAction({
                    sourceNodeId:
                        draft.sourceNodeId,
                    targetNodeId:
                        draft.targetNodeId,
                    cableName:
                        cableName.trim(),
                    cableType:
                        cableType.trim() || null,
                    fiberType:
                        fiberType.trim() || null,
                    coreCount:
                        parsedCoreCount,

                    /*
                     * Route length dihitung ulang
                     * oleh server.
                     */
                    estimatedLengthMeters: null,

                    actualLengthMeters:
                        actualLength,
                    attenuationDbPerKm:
                        attenuation,
                    description:
                        description.trim() || null,
                    waypoints:
                        draft.waypoints,
                });

            if (!result.success) {
                setError(result.message);
                return;
            }

            onCreated(result.data);
            onOpenChange(false);
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isPending) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Buat Fiber Link
                    </DialogTitle>

                    <DialogDescription>
                        Simpan jalur fiber yang baru
                        digambar ke database.
                    </DialogDescription>
                </DialogHeader>

                {draft && (
                    <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
                        <Route className="size-4 shrink-0" />

                        <div>
                            <p className="font-medium">
                                {draft.sourceCode}
                                {" → "}
                                {draft.targetCode}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {draft.routeLengthMeters.toFixed(
                                    1,
                                )}{" "}
                                meter ·{" "}
                                {draft.waypoints.length} waypoint
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="cable-name">
                            Nama Kabel
                        </Label>

                        <Input
                            id="cable-name"
                            value={cableName}
                            onChange={(event) =>
                                setCableName(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cable-type">
                            Tipe Kabel
                        </Label>

                        <Input
                            id="cable-type"
                            placeholder="Outdoor / Dropcore"
                            value={cableType}
                            onChange={(event) =>
                                setCableType(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fiber-type">
                            Fiber Type
                        </Label>

                        <Input
                            id="fiber-type"
                            placeholder="G.652D"
                            value={fiberType}
                            onChange={(event) =>
                                setFiberType(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="core-count">
                            Jumlah Core
                        </Label>

                        <Input
                            id="core-count"
                            type="number"
                            min={1}
                            max={288}
                            value={coreCount}
                            onChange={(event) =>
                                setCoreCount(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="actual-length">
                            Panjang Aktual (m)
                        </Label>

                        <Input
                            id="actual-length"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Opsional"
                            value={actualLengthMeters}
                            onChange={(event) =>
                                setActualLengthMeters(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="attenuation">
                            Redaman dB/km
                        </Label>

                        <Input
                            id="attenuation"
                            type="number"
                            min={0}
                            step="0.001"
                            value={attenuationDbPerKm}
                            onChange={(event) =>
                                setAttenuationDbPerKm(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="link-description">
                            Deskripsi
                        </Label>

                        <Textarea
                            id="link-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value,
                                )
                            }
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-destructive">
                        {error}
                    </p>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                            onOpenChange(false)
                        }
                    >
                        Batal
                    </Button>

                    <Button
                        type="button"
                        disabled={
                            isPending ||
                            !draft ||
                            !cableName.trim()
                        }
                        onClick={handleSubmit}
                    >
                        {isPending && (
                            <Loader2 className="size-4 animate-spin" />
                        )}

                        {isPending
                            ? "Menyimpan..."
                            : "Simpan Fiber Link"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}