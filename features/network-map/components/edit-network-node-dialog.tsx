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
import { updateNetworkTopologyNodeAction } from "../actions/update-network-topology-node.action";
import type {
    NetworkMapNodeDto,
    NetworkMapNodeEditTarget,
} from "../types/network-map-persistence.types";
import { createDistributionTopologyNodeAction } from "../actions/create-distribution-topology-node.action";

type EditNetworkNodeDialogProps = {
    open: boolean;
    node: NetworkMapNodeEditTarget | null;
    onOpenChange: (open: boolean) => void;
    onUpdated: (node: any) => void;
};

export function EditNetworkNodeDialog({
    open,
    node,
    onOpenChange,
    onUpdated,
}: EditNetworkNodeDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [portCapacity, setPortCapacity] = useState("8");

    useEffect(() => {
        if (!node) return;
        setCode(node.code);
        setName(node.name);
        setStatus(node.status);
        setAddress(node.address ?? "");
        setDescription(node.description ?? "");
        setPortCapacity("8");
        setError(null);
    }, [node]);

    function handleSubmit() {
        if (!node || isPending) return;

        startTransition(async () => {
            setError(null);

            const result = await updateNetworkTopologyNodeAction({
                id: node.id,
                code,
                name,
                status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
                address: address || null,
                description: description || null,
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            onUpdated(result.data);
            onOpenChange(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Titik Jaringan</DialogTitle>
                    <DialogDescription>
                        Perbarui informasi titik tanpa mengubah jenis perangkat atau referensinya.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-node-code">Kode</Label>
                        <Input
                            id="edit-node-code"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-node-name">Nama</Label>
                        <Input
                            id="edit-node-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={() => setStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-node-address">Alamat</Label>
                        <Input
                            id="edit-node-address"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-node-description">Deskripsi</Label>
                        <Textarea
                            id="edit-node-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>

                    <Button
                        type="button"
                        disabled={isPending || !code.trim() || !name.trim()}
                        onClick={handleSubmit}
                    >
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        {isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}