"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { getOltAction } from "../actions/get-olt.action";
import { updateOltAction } from "../actions/update-olt.action";

type Props = {
    id: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type FieldErrors = Record<string, string[] | undefined>;

function FieldError({ errors }: { errors?: string[] }) {
    if (!errors?.length) return null;
    return <p className="text-sm text-destructive">{errors[0]}</p>;
}

export function EditOltDialog({ id, open, onOpenChange }: Props) {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [ponCount, setPonCount] = useState("1");
    const [originalPonCount, setOriginalPonCount] = useState(1);
    const [baseUrl, setBaseUrl] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    useEffect(() => {
        if (!open || id === null) return;

        let active = true;

        async function load() {
            setIsLoading(true);
            setError(null);
            setFieldErrors({});
            setPassword("");

            const result = await getOltAction(id!);

            if (!active) return;

            if (!result.success) {
                setError(result.message);
                setIsLoading(false);
                return;
            }

            const data = result.data;

            setName(data.name);
            setBrand(data.brand ?? "");
            setModel(data.model ?? "");
            setPonCount(String(data.ponCount));
            setOriginalPonCount(data.ponCount);
            setBaseUrl(data.baseUrl);
            setUsername(data.username);
            setDescription(data.description ?? "");
            setIsActive(data.isActive);
            setIsLoading(false);
        }

        void load();

        return () => { active = false };
    }, [open, id]);

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (id === null) return;

        startTransition(async () => {
            setError(null);
            setFieldErrors({});

            const result = await updateOltAction({
                id,
                name,
                brand,
                model,
                ponCount,
                baseUrl,
                username,
                password,
                isActive,
                description,
            });

            if (!result.success) {
                setError(result.message);

                if ("errors" in result && result.errors)
                    setFieldErrors(result.errors);

                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            onOpenChange(false);
        });
    }

    const selectedPonCount = Number(ponCount);
    const shrinking = Number.isFinite(selectedPonCount) &&
        selectedPonCount < originalPonCount;

    return (
        <Dialog open={open} onOpenChange={(next) => {
            if (!isPending) onOpenChange(next);
        }}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit OLT</DialogTitle>
                    <DialogDescription>
                        Ubah konfigurasi OLT dan jumlah physical PON port.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex min-h-48 items-center justify-center">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-olt-name">Nama OLT</Label>
                                <Input id="edit-olt-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                                <FieldError errors={fieldErrors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-olt-pon">Jumlah PON</Label>
                                <Input id="edit-olt-pon" type="number" min={1} max={256} value={ponCount} onChange={(e) => setPonCount(e.target.value)} disabled={isPending} />
                                <FieldError errors={fieldErrors.ponCount} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-olt-brand">Brand</Label>
                                <Input id="edit-olt-brand" value={brand} onChange={(e) => setBrand(e.target.value)} disabled={isPending} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-olt-model">Model</Label>
                                <Input id="edit-olt-model" value={model} onChange={(e) => setModel(e.target.value)} disabled={isPending} />
                            </div>
                        </div>

                        {shrinking && (
                            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                                Jumlah PON akan dikurangi dari {originalPonCount} menjadi {selectedPonCount}.
                                PON yang sudah digunakan topology tidak dapat dihapus.
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-olt-url">Base URL</Label>
                            <Input id="edit-olt-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} disabled={isPending} />
                            <FieldError errors={fieldErrors.baseUrl} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-olt-user">Username</Label>
                                <Input id="edit-olt-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" disabled={isPending} />
                                <FieldError errors={fieldErrors.username} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-olt-password">Password baru</Label>
                                <Input
                                    id="edit-olt-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Kosongkan jika tidak diubah"
                                    autoComplete="new-password"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-olt-description">Deskripsi</Label>
                            <Textarea id="edit-olt-description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
                        </div>

                        <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                disabled={isPending}
                                className="size-4"
                            />
                            <span className="text-sm font-medium">OLT aktif</span>
                        </label>

                        {error && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                {isPending ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}