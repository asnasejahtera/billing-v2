"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import {
    Loader2,
    Plus,
    Router,
} from "lucide-react";
import { createRouterAction } from "@/features/routers/actions/create-router.action";
import { initialCreateRouterState } from "@/features/routers/types/create-router-action-state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

export function CreateRouterDialog() {
    const [open, setOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);

    function handleOpenChange(value: boolean) {
        setOpen(value);

        if (value) {
            setFormKey((current) => current + 1);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger
                className={buttonVariants()}
            >
                <Plus />
                Tambah Router
            </DialogTrigger>

            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Tambah Router
                    </DialogTitle>
                    <DialogDescription>
                        Tambahkan MikroTik router yang akan
                        dikelola aplikasi.
                    </DialogDescription>
                </DialogHeader>

                <CreateRouterForm
                    key={formKey}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

type CreateRouterFormProps = {
    onSuccess: () => void;
};

function CreateRouterForm({
    onSuccess,
}: CreateRouterFormProps) {
    const [useHttps, setUseHttps] =
        useState(false);

    const [state, formAction, isPending] =
        useActionState(
            createRouterAction,
            initialCreateRouterState,
        );

    useEffect(() => {
        if (!state.success) {
            return;
        }

        toast.add({
            type: "success",
            title: "Router berhasil ditambahkan",
            description: state.message,
        });

        onSuccess();
    }, [state.success, state.message, onSuccess]);

    return (
        <form
            action={formAction}
            className="space-y-5"
        >
            {state.success === false &&
                state.message && (
                    <div
                        role="alert"
                        className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                        {state.message}
                    </div>
                )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="router-name">
                        Nama Router
                    </Label>
                    <Input
                        id="router-name"
                        name="name"
                        placeholder="CCR-GATEWAY-01"
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.name,
                        )}
                    />
                    <FieldError
                        message={state.errors?.name?.[0]}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="router-host">
                        Host / IP
                    </Label>
                    <Input
                        id="router-host"
                        name="host"
                        placeholder="192.168.88.1"
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.host,
                        )}
                    />
                    <FieldError
                        message={state.errors?.host?.[0]}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="router-port">
                        Port
                    </Label>
                    <Input
                        id="router-port"
                        name="port"
                        type="number"
                        min={1}
                        max={65535}
                        defaultValue={8728}
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.port,
                        )}
                    />
                    <FieldError
                        message={state.errors?.port?.[0]}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="router-username">
                        Username
                    </Label>
                    <Input
                        id="router-username"
                        name="username"
                        autoComplete="off"
                        placeholder="admin"
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.username,
                        )}
                    />
                    <FieldError
                        message={
                            state.errors?.username?.[0]
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="router-password">
                        Password
                    </Label>
                    <Input
                        id="router-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Password router"
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.password,
                        )}
                    />
                    <FieldError
                        message={
                            state.errors?.password?.[0]
                        }
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="router-description">
                        Deskripsi
                    </Label>
                    <Input
                        id="router-description"
                        name="description"
                        placeholder="Router gateway utama"
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.description,
                        )}
                    />
                    <FieldError
                        message={
                            state.errors?.description?.[0]
                        }
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="min-w-0">
                    <Label htmlFor="router-https">
                        Gunakan HTTPS
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Digunakan saat koneksi membutuhkan
                        protokol HTTPS.
                    </p>
                </div>

                <input
                    type="hidden"
                    name="useHttps"
                    value={
                        useHttps
                            ? "true"
                            : "false"
                    }
                />

                <Switch
                    id="router-https"
                    checked={useHttps}
                    onCheckedChange={setUseHttps}
                    disabled={isPending}
                />
            </div>

            <DialogFooter>
                <DialogClose
                    type="button"
                    className={buttonVariants({
                        variant: "outline",
                    })}
                    disabled={isPending}
                >
                    Batal
                </DialogClose>

                <Button
                    type="submit"
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Router />
                    )}

                    {isPending
                        ? "Menyimpan..."
                        : "Simpan Router"}
                </Button>
            </DialogFooter>
        </form>
    );
}

function FieldError({
    message,
}: {
    message?: string;
}) {
    if (!message) {
        return null;
    }

    return (
        <p className="text-xs text-destructive">
            {message}
        </p>
    );
}