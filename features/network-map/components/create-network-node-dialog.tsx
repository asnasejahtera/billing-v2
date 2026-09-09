"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
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
import { createDistributionTopologyNodeAction } from "../actions/create-distribution-topology-node.action";
import { createNetworkTopologyNodeAction } from "../actions/create-network-topology-node.action";
import type { CreateNetworkTopologyNodeInput } from "../schemas/network-topology-node.schema";
import type {
    NetworkMapCreateOptions,
    NetworkMapNodeDto,
    NetworkMapNodeReferenceOption,
} from "../types/network-map-persistence.types";
import type { Coordinate } from "../types/network-map.types";

type NodeType = CreateNetworkTopologyNodeInput["nodeType"];

type CreateNetworkNodeDialogProps = {
    open: boolean;
    coordinate: Coordinate | null;
    createOptions: NetworkMapCreateOptions;
    onOpenChange: (open: boolean) => void;
    onCreated: (node: NetworkMapNodeDto) => void;
};

const NODE_TYPES: Array<{ value: NodeType; label: string }> = [
    { value: "ODP", label: "ODP" },
    { value: "ODC", label: "ODC" },
    { value: "OLT", label: "OLT" },
    { value: "ROUTER", label: "Router" },
    { value: "CUSTOMER", label: "Customer" },
    { value: "POLE", label: "Tiang" },
];

const DISTRIBUTION_PORT_OPTIONS = [
    { value: "2", label: "1:2 · 1 IN + 2 OUT" },
    { value: "4", label: "1:4 · 1 IN + 4 OUT" },
    { value: "8", label: "1:8 · 1 IN + 8 OUT" },
    { value: "16", label: "1:16 · 1 IN + 16 OUT" },
    { value: "32", label: "1:32 · 1 IN + 32 OUT" },
    { value: "64", label: "1:64 · 1 IN + 64 OUT" },
];

export function CreateNetworkNodeDialog({
    open,
    coordinate,
    createOptions,
    onOpenChange,
    onCreated,
}: CreateNetworkNodeDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [nodeType, setNodeType] = useState<NodeType>("ODP");
    const [referenceId, setReferenceId] = useState("");
    const [portCapacity, setPortCapacity] = useState("8");
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const isDistribution = nodeType === "ODC" || nodeType === "ODP";
    const requiresReference =
        nodeType === "ROUTER" ||
        nodeType === "OLT" ||
        nodeType === "CUSTOMER";

    /*
     * =========================
     * RESET FORM
     * =========================
     */
    useEffect(() => {
        if (!open) return;

        setNodeType("ODP");
        setReferenceId("");
        setPortCapacity("8");
        setCode("");
        setName("");
        setAddress("");
        setDescription("");
        setError(null);
    }, [open, coordinate]);

    /*
     * =========================
     * REFERENCE OPTIONS
     * =========================
     * ODC/ODP tidak memilih device existing.
     * Device dibuat bersamaan dengan topology node.
     */
    function getReferenceOptions(
        type: NodeType,
    ): NetworkMapNodeReferenceOption[] {
        if (type === "ROUTER") return createOptions.routers;
        if (type === "OLT") return createOptions.olts;
        if (type === "CUSTOMER") return createOptions.customers;
        return [];
    }

    function getReferenceLabel(type: NodeType) {
        if (type === "ROUTER") return "Router";
        if (type === "OLT") return "OLT";
        if (type === "CUSTOMER") return "Customer";
        return "";
    }

    /*
     * =========================
     * SELECT HANDLERS
     * =========================
     */
    function handleTypeChange(value: string | null) {
        if (!value) return;

        const nextType = value as NodeType;

        setNodeType(nextType);
        setReferenceId("");
        setError(null);

        /*
         * ODC/ODP dibuat sebagai device baru,
         * jadi nama tidak mengikuti reference.
         */
        if (
            nextType === "ODC" ||
            nextType === "ODP" ||
            nextType === "POLE"
        ) {
            setName("");
        }
    }

    function handleReferenceChange(value: string | null) {
        if (!value) {
            setReferenceId("");
            return;
        }

        setReferenceId(value);

        const selected = getReferenceOptions(nodeType).find(
            (option) => option.id === Number(value),
        );

        if (selected) setName(selected.label);
    }

    /*
     * =========================
     * SUBMIT
     * =========================
     */
    async function submit() {
        if (!coordinate) return;

        const trimmedCode = code.trim();
        const trimmedName = name.trim();

        if (!trimmedCode) {
            setError("Kode wajib diisi");
            return;
        }

        if (!trimmedName) {
            setError("Nama wajib diisi");
            return;
        }

        /*
         * =========================
         * CREATE ODC / ODP
         * =========================
         */
        if (nodeType === "ODC" || nodeType === "ODP") {
            const capacity = Number(portCapacity);

            if (!Number.isInteger(capacity) || capacity < 1) {
                setError("Kapasitas port tidak valid");
                return;
            }

            setError(null);

            const result =
                await createDistributionTopologyNodeAction({
                    code: trimmedCode,
                    name: trimmedName,
                    nodeType,
                    latitude: coordinate.lat,
                    longitude: coordinate.lng,
                    portCapacity: capacity,
                    address: address.trim() || null,
                    description: description.trim() || null,
                });

            if (!result.success) {
                setError(result.message);
                return;
            }

            onCreated(result.data);
            onOpenChange(false);
            return;
        }

        /*
         * =========================
         * NORMAL NODE
         * =========================
         * Sampai sini TypeScript sudah tahu:
         * ROUTER | OLT | CUSTOMER | POLE.
         */
        const needsReference =
            nodeType === "ROUTER" ||
            nodeType === "OLT" ||
            nodeType === "CUSTOMER";

        if (needsReference && !referenceId) {
            setError(`${getReferenceLabel(nodeType)} wajib dipilih`);
            return;
        }

        setError(null);

        const selectedId =
            needsReference
                ? Number(referenceId)
                : null;

        const input: CreateNetworkTopologyNodeInput = {
            code: trimmedCode,
            name: trimmedName,
            nodeType,
            latitude: coordinate.lat,
            longitude: coordinate.lng,
            routerId:
                nodeType === "ROUTER"
                    ? selectedId
                    : null,
            oltId:
                nodeType === "OLT"
                    ? selectedId
                    : null,
            distributionDeviceId: null,
            customerId:
                nodeType === "CUSTOMER"
                    ? selectedId
                    : null,
            address: address.trim() || null,
            description: description.trim() || null,
        };

        const result =
            await createNetworkTopologyNodeAction(input);

        if (!result.success) {
            setError(result.message);
            return;
        }

        onCreated(result.data);
        onOpenChange(false);
    }

    const referenceOptions =
        getReferenceOptions(nodeType);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isPending) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Tambah Titik Jaringan
                    </DialogTitle>

                    <DialogDescription>
                        Tambahkan perangkat atau titik jaringan pada lokasi yang dipilih.
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();

                        startTransition(() => {
                            void submit();
                        });
                    }}
                >
                    {/* =========================
              NODE TYPE
              ========================= */}
                    <div className="space-y-2">
                        <Label>Jenis Titik</Label>

                        <Select
                            value={nodeType}
                            onValueChange={handleTypeChange}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih jenis titik" />
                            </SelectTrigger>

                            <SelectContent>
                                {NODE_TYPES.map((type) => (
                                    <SelectItem
                                        key={type.value}
                                        value={type.value}
                                    >
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* =========================
              ODC / ODP CONFIGURATION
              ========================= */}
                    {isDistribution && (
                        <div className="space-y-2">
                            <Label>
                                Splitter / Kapasitas Port
                            </Label>

                            <Select
                                value={portCapacity}
                                onValueChange={(value) =>
                                    setPortCapacity(value ?? "8")
                                }
                                disabled={isPending}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih rasio splitter" />
                                </SelectTrigger>

                                <SelectContent>
                                    {DISTRIBUTION_PORT_OPTIONS.map(
                                        (option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>

                            <p className="text-xs text-muted-foreground">
                                {portCapacity
                                    ? `Akan dibuat otomatis 1 INPUT + ${portCapacity} OUTPUT.`
                                    : "Port akan dibuat otomatis saat perangkat disimpan."}
                            </p>
                        </div>
                    )}

                    {/* =========================
              EXISTING DEVICE REFERENCE
              ========================= */}
                    {requiresReference && (
                        <div className="space-y-2">
                            <Label>
                                {getReferenceLabel(nodeType)}
                            </Label>

                            <Select
                                value={referenceId}
                                onValueChange={handleReferenceChange}
                                disabled={isPending}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={`Pilih ${getReferenceLabel(nodeType)}`}
                                    />
                                </SelectTrigger>

                                <SelectContent>
                                    {referenceOptions.map((option) => (
                                        <SelectItem
                                            key={option.id}
                                            value={String(option.id)}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {referenceOptions.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Tidak ada {getReferenceLabel(nodeType)} yang tersedia.
                                </p>
                            )}
                        </div>
                    )}

                    {/* =========================
              IDENTITY
              ========================= */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="topology-node-code">
                                Kode
                            </Label>

                            <Input
                                id="topology-node-code"
                                value={code}
                                onChange={(event) =>
                                    setCode(event.target.value)
                                }
                                placeholder={
                                    nodeType === "ODP"
                                        ? "ODP-001"
                                        : nodeType === "ODC"
                                            ? "ODC-001"
                                            : "NODE-001"
                                }
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="topology-node-name">
                                Nama
                            </Label>

                            <Input
                                id="topology-node-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder={
                                    nodeType === "ODP"
                                        ? "ODP Area A"
                                        : nodeType === "ODC"
                                            ? "ODC Area A"
                                            : "Nama titik"
                                }
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {/* =========================
              COORDINATE
              ========================= */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Latitude</Label>

                            <Input
                                value={
                                    coordinate?.lat.toFixed(7) ?? ""
                                }
                                readOnly
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Longitude</Label>

                            <Input
                                value={
                                    coordinate?.lng.toFixed(7) ?? ""
                                }
                                readOnly
                            />
                        </div>
                    </div>

                    {/* =========================
              OPTIONAL DETAIL
              ========================= */}
                    <div className="space-y-2">
                        <Label htmlFor="topology-node-address">
                            Alamat
                        </Label>

                        <Textarea
                            id="topology-node-address"
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                            placeholder="Alamat lokasi..."
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="topology-node-description">
                            Deskripsi
                        </Label>

                        <Textarea
                            id="topology-node-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Catatan tambahan..."
                            disabled={isPending}
                        />
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
                            onClick={() =>
                                onOpenChange(false)
                            }
                            disabled={isPending}
                        >
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                isPending ||
                                !coordinate
                            }
                        >
                            {isPending && (
                                <Loader2 className="size-4 animate-spin" />
                            )}

                            {isPending
                                ? "Menyimpan..."
                                : "Simpan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}