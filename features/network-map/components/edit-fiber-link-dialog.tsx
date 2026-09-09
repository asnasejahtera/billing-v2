"use client";

import {
    Loader2,
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
import { getNetworkTopologyLinkEditAction } from "../actions/get-network-topology-link-edit.action";
import { updateNetworkTopologyLinkAction } from "../actions/update-network-topology-link.action";

type EditFiberLinkDialogProps = {
    open: boolean;
    linkId: number | null;
    onOpenChange: (open: boolean) => void;
};

export function EditFiberLinkDialog({
    open,
    linkId,
    onOpenChange,
}: EditFiberLinkDialogProps) {
    const [isSaving, startTransition] =
        useTransition();
    const [isLoading, setIsLoading] =
        useState(false);
    const [sourceCode, setSourceCode] =
        useState("");
    const [targetCode, setTargetCode] =
        useState("");
    const [coreCount, setCoreCount] =
        useState(0);
    const [routeLength, setRouteLength] =
        useState(0);
    const [cableName, setCableName] =
        useState("");
    const [cableType, setCableType] =
        useState("");
    const [fiberType, setFiberType] =
        useState("");
    const [estimatedLength, setEstimatedLength] =
        useState("");
    const [actualLength, setActualLength] =
        useState("");
    const [attenuation, setAttenuation] =
        useState("");
    const [cableDescription, setCableDescription] =
        useState("");
    const [linkDescription, setLinkDescription] =
        useState("");
    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        if (!open || !linkId) return;

        let active = true;

        async function load() {
            setIsLoading(true);
            setError(null);

            const result =
                await getNetworkTopologyLinkEditAction({
                    id: linkId!,
                });

            if (!active) return;

            if (!result.success) {
                setError(result.message);
                setIsLoading(false);
                return;
            }

            const data = result.data;

            setSourceCode(data.sourceCode);
            setTargetCode(data.targetCode);
            setCoreCount(data.coreCount);
            setRouteLength(data.routeLengthMeters);
            setCableName(data.cableName);
            setCableType(data.cableType ?? "");
            setFiberType(data.fiberType ?? "");
            setEstimatedLength(
                data.estimatedLengthMeters?.toString() ?? "",
            );
            setActualLength(
                data.actualLengthMeters?.toString() ?? "",
            );
            setAttenuation(
                data.attenuationDbPerKm?.toString() ?? "",
            );
            setCableDescription(
                data.cableDescription ?? "",
            );
            setLinkDescription(
                data.linkDescription ?? "",
            );
            setIsLoading(false);
        }

        void load();

        return () => {
            active = false;
        };
    }, [open, linkId]);

    function parseOptionalNumber(
        value: string,
    ) {
        if (!value.trim()) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed)
            ? parsed
            : Number.NaN;
    }

    function handleSubmit() {
        if (!linkId || isSaving) return;

        const estimated =
            parseOptionalNumber(estimatedLength);
        const actual =
            parseOptionalNumber(actualLength);
        const attenuationValue =
            parseOptionalNumber(attenuation);

        if (
            Number.isNaN(estimated) ||
            Number.isNaN(actual) ||
            Number.isNaN(attenuationValue)
        ) {
            setError("Nilai angka tidak valid.");
            return;
        }

        startTransition(async () => {
            setError(null);

            const result =
                await updateNetworkTopologyLinkAction({
                    id: linkId,
                    cableName,
                    cableType:
                        cableType.trim() || null,
                    fiberType:
                        fiberType.trim() || null,
                    estimatedLengthMeters:
                        estimated,
                    actualLengthMeters:
                        actual,
                    attenuationDbPerKm:
                        attenuationValue,
                    cableDescription:
                        cableDescription.trim() || null,
                    linkDescription:
                        linkDescription.trim() || null,
                });

            if (!result.success) {
                setError(result.message);
                return;
            }

            onOpenChange(false);
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isSaving) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        Edit Fiber Link
                    </DialogTitle>
                    <DialogDescription>
                        Edit data kabel tanpa mengubah endpoint dan geometry jalur.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex min-h-40 items-center justify-center">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                            <p className="font-medium">
                                {sourceCode} → {targetCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {routeLength.toFixed(2)} m · {coreCount} core
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-cable-name">
                                Nama Kabel
                            </Label>
                            <Input
                                id="edit-cable-name"
                                value={cableName}
                                onChange={(event) =>
                                    setCableName(event.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-cable-type">
                                    Cable Type
                                </Label>
                                <Input
                                    id="edit-cable-type"
                                    value={cableType}
                                    onChange={(event) =>
                                        setCableType(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-fiber-type">
                                    Fiber Type
                                </Label>
                                <Input
                                    id="edit-fiber-type"
                                    value={fiberType}
                                    onChange={(event) =>
                                        setFiberType(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-estimated-length">
                                    Estimated Length (m)
                                </Label>
                                <Input
                                    id="edit-estimated-length"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={estimatedLength}
                                    onChange={(event) =>
                                        setEstimatedLength(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-actual-length">
                                    Actual Length (m)
                                </Label>
                                <Input
                                    id="edit-actual-length"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={actualLength}
                                    onChange={(event) =>
                                        setActualLength(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-attenuation">
                                    Attenuation dB/km
                                </Label>
                                <Input
                                    id="edit-attenuation"
                                    type="number"
                                    min={0}
                                    step="0.001"
                                    value={attenuation}
                                    onChange={(event) =>
                                        setAttenuation(event.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-cable-description">
                                Deskripsi Kabel
                            </Label>
                            <Textarea
                                id="edit-cable-description"
                                value={cableDescription}
                                onChange={(event) =>
                                    setCableDescription(event.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-link-description">
                                Deskripsi Link
                            </Label>
                            <Textarea
                                id="edit-link-description"
                                value={linkDescription}
                                onChange={(event) =>
                                    setLinkDescription(event.target.value)
                                }
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() =>
                            onOpenChange(false)
                        }
                    >
                        Batal
                    </Button>

                    <Button
                        type="button"
                        disabled={
                            isLoading ||
                            isSaving ||
                            !cableName.trim()
                        }
                        onClick={handleSubmit}
                    >
                        {isSaving && (
                            <Loader2 className="size-4 animate-spin" />
                        )}
                        {isSaving
                            ? "Menyimpan..."
                            : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}