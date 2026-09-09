"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOltAction } from "../actions/create-olt.action";

type FieldErrors = Record<string, string[] | undefined>;

function FieldError({ errors }: { errors?: string[] }) {
    if (!errors?.length) return null;
    return <p className="text-sm text-destructive">{errors[0]}</p>;
}

export function CreateOltDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [ponCount, setPonCount] = useState("4");
    const [baseUrl, setBaseUrl] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    function reset() {
        setName("");
        setBrand("");
        setModel("");
        setPonCount("4");
        setBaseUrl("");
        setUsername("");
        setPassword("");
        setDescription("");
        setIsActive(true);
        setError(null);
        setFieldErrors({});
    }

    async function submit() {
        setError(null);
        setFieldErrors({});

        const result = await createOltAction({
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
            if ("errors" in result && result.errors) setFieldErrors(result.errors);
            toast.error(result.message);
            return;
        }

        toast.success(result.message);
        reset();
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isPending) return;
                setOpen(nextOpen);
                if (!nextOpen) reset();
            }}
        >
            <DialogTrigger
                render={
                    <Button type="button">
                        <Plus className="size-4" />
                        Tambah OLT
                    </Button>
                }
            />

            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Tambah OLT</DialogTitle>
                    <DialogDescription>
                        Tambahkan perangkat OLT dan buat physical PON port secara otomatis.
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        startTransition(() => { void submit(); });
                    }}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="olt-name">Nama OLT</Label>
                            <Input
                                id="olt-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="OLT Utama"
                                disabled={isPending}
                            />
                            <FieldError errors={fieldErrors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="olt-pon-count">Jumlah PON</Label>
                            <Input
                                id="olt-pon-count"
                                type="number"
                                min={1}
                                max={256}
                                value={ponCount}
                                onChange={(event) => setPonCount(event.target.value)}
                                disabled={isPending}
                            />
                            <FieldError errors={fieldErrors.ponCount} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="olt-brand">Brand</Label>
                            <Input
                                id="olt-brand"
                                value={brand}
                                onChange={(event) => setBrand(event.target.value)}
                                placeholder="HSGQ"
                                disabled={isPending}
                            />
                            <FieldError errors={fieldErrors.brand} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="olt-model">Model</Label>
                            <Input
                                id="olt-model"
                                value={model}
                                onChange={(event) => setModel(event.target.value)}
                                placeholder="Opsional"
                                disabled={isPending}
                            />
                            <FieldError errors={fieldErrors.model} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="olt-url">Base URL</Label>
                        <Input
                            id="olt-url"
                            value={baseUrl}
                            onChange={(event) => setBaseUrl(event.target.value)}
                            placeholder="http://192.168.1.10"
                            disabled={isPending}
                        />
                        <FieldError errors={fieldErrors.baseUrl} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="olt-username">Username</Label>
                            <Input
                                id="olt-username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                autoComplete="off"
                                disabled={isPending}
                            />
                            <FieldError errors={fieldErrors.username} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="olt-password">Password</Label>
                            <Input
                                id="olt-password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                disabled={isPending}
                            />
                            <FieldError errors={fieldErrors.password} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="olt-description">Deskripsi</Label>
                        <Textarea
                            id="olt-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Opsional"
                            disabled={isPending}
                        />
                        <FieldError errors={fieldErrors.description} />
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) => setIsActive(event.target.checked)}
                            disabled={isPending}
                            className="size-4"
                        />
                        <span>
                            <span className="block text-sm font-medium">OLT aktif</span>
                            <span className="block text-xs text-muted-foreground">
                                OLT dapat dipilih pada topology map.
                            </span>
                        </span>
                    </label>

                    {error && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="size-4 animate-spin" />}
                            {isPending ? "Menyimpan..." : "Simpan OLT"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}