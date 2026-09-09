"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getDistributionTopologyNodeDetailAction } from "../actions/get-distribution-topology-node-detail.action";
import { updateDistributionTopologyNodeAction } from "../actions/update-distribution-topology-node.action";
import type { NetworkMapNodeDto } from "../types/network-map-persistence.types";
import type { NetworkMapNodeEditTarget } from "../types/network-map-runtime.types";

const RATIOS = [
    { value: "2", label: "1:2" },
    { value: "4", label: "1:4" },
    { value: "8", label: "1:8" },
    { value: "16", label: "1:16" },
    { value: "32", label: "1:32" },
    { value: "64", label: "1:64" },
];

type Props = {
    node: NetworkMapNodeEditTarget | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated: (node: NetworkMapNodeDto) => void;
};

export function EditDistributionTopologyNodeDialog({
    node,
    open,
    onOpenChange,
    onUpdated,
}: Props) {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [portCapacity, setPortCapacity] = useState("8");
    const [originalCapacity, setOriginalCapacity] = useState(8);
    const [inputPower, setInputPower] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*
     * =========================
     * LOAD CURRENT CONFIG
     * =========================
     */
    useEffect(() => {
        if (!open || !node) return;

        let active = true;

        async function load() {
            setIsLoading(true);
            setError(null);

            const result =
                await getDistributionTopologyNodeDetailAction({
                    nodeId: node!.id,
                });

            if (!active) return;

            if (!result.success) {
                setError(result.message);
                setIsLoading(false);
                return;
            }

            const data = result.data;

            setCode(data.code);
            setName(data.name);
            setPortCapacity(String(data.portCapacity));
            setOriginalCapacity(data.portCapacity);
            setInputPower(
                data.inputPowerDbm === null
                    ? ""
                    : String(data.inputPowerDbm),
            );
            setAddress(data.address ?? "");
            setDescription(data.description ?? "");
            setIsLoading(false);
        }

        void load();

        return () => { active = false };
    }, [open, node]);

    /*
     * =========================
     * SAVE
     * =========================
     */
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!node || isSaving) return;

        setIsSaving(true);
        setError(null);

        const power = inputPower.trim() === ""
            ? null
            : Number(inputPower);

        if (power !== null && !Number.isFinite(power)) {
            setError("Input Power tidak valid");
            setIsSaving(false);
            return;
        }

        const result =
            await updateDistributionTopologyNodeAction({
                nodeId: node.id,
                code: code.trim(),
                name: name.trim(),
                portCapacity: Number(portCapacity),
                inputPowerDbm: power,
                address: address.trim() || null,
                description: description.trim() || null,
            });

        if (!result.success) {
            setError(result.message);
            setIsSaving(false);
            return;
        }

        onUpdated(result.data.node);
        setIsSaving(false);
        onOpenChange(false);
    }

    const selectedCapacity = Number(portCapacity);
    const isShrinking = selectedCapacity < originalCapacity;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit {node?.nodeType ?? "ODC/ODP"}</DialogTitle>
                    <DialogDescription>
                        Ubah informasi dan konfigurasi splitter.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex min-h-40 items-center justify-center">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="distribution-code">Kode</Label>
                                <Input
                                    id="distribution-code"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value)}
                                    disabled={isSaving}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="distribution-name">Nama</Label>
                                <Input
                                    id="distribution-name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    disabled={isSaving}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Splitter Ratio</Label>
                                <Select
                                    value={portCapacity}
                                    onValueChange={(value) => {
                                        if (value) setPortCapacity(value);
                                    }}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RATIOS.map((ratio) => (
                                            <SelectItem key={ratio.value} value={ratio.value}>
                                                {ratio.label} · {ratio.value} OUTPUT
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="distribution-power">Input Power (dBm)</Label>
                                <Input
                                    id="distribution-power"
                                    type="number"
                                    step="0.01"
                                    value={inputPower}
                                    onChange={(event) => setInputPower(event.target.value)}
                                    disabled={isSaving}
                                    placeholder="-18.50"
                                />
                            </div>
                        </div>

                        {isShrinking && (
                            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                                Ratio akan dikurangi dari 1:{originalCapacity} menjadi 1:{selectedCapacity}.
                                OUTPUT setelah {selectedCapacity} hanya akan dihapus jika AVAILABLE dan tidak memiliki riwayat koneksi core.
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="distribution-address">Alamat</Label>
                            <Textarea
                                id="distribution-address"
                                value={address}
                                onChange={(event) => setAddress(event.target.value)}
                                disabled={isSaving}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="distribution-description">Deskripsi</Label>
                            <Textarea
                                id="distribution-description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                disabled={isSaving}
                                rows={3}
                            />
                        </div>

                        {error && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving}
                            >
                                Batal
                            </Button>

                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="size-4 animate-spin" />}
                                {isSaving ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}