"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import {
    Loader2,
    Pencil,
    Save,
} from "lucide-react";
import { updateRouterAction } from "@/features/routers/actions/update-router.action";
import { initialUpdateRouterState } from "@/features/routers/types/update-router-action-state";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

export type EditRouterData = {
    id: number;
    name: string;
    host: string;
    port: number;
    username: string;
    useHttps: boolean;
    description: string | null;
};

type EditRouterDialogProps = {
    router: EditRouterData;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
};

export function EditRouterDialog({
    router,
    open,
    onOpenChange,
    showTrigger = true,
}: EditRouterDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const dialogOpen =
        open !== undefined
            ? open
            : internalOpen;

    function handleOpenChange(value: boolean) {
        if (open === undefined) {
            setInternalOpen(value);
        }

        onOpenChange?.(value);
    }

    return (
        <>
            {showTrigger && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        handleOpenChange(true)
                    }
                >
                    <Pencil />
                    Edit
                </Button>
            )}

            <Dialog
                open={dialogOpen}
                onOpenChange={handleOpenChange}
            >
                <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Router
                        </DialogTitle>

                        <DialogDescription>
                            Perbarui konfigurasi router.
                            Kosongkan password jika tidak ingin menggantinya.
                        </DialogDescription>
                    </DialogHeader>

                    <EditRouterForm
                        router={router}
                        onSuccess={() =>
                            handleOpenChange(false)
                        }
                        onCancel={() =>
                            handleOpenChange(false)
                        }
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

type EditRouterFormProps = {
    router: EditRouterData;
    onSuccess: () => void;
    onCancel: () => void;
};

function EditRouterForm({
    router,
    onSuccess,
    onCancel,
}: EditRouterFormProps) {
    const [useHttps, setUseHttps] =
        useState(router.useHttps);

    const [state, formAction, isPending] =
        useActionState(
            updateRouterAction,
            initialUpdateRouterState,
        );

    useEffect(() => {
        if (!state.success) {
            return;
        }

        toast.add({
            type: "success",
            title:
                "Router berhasil diperbarui",
            description: state.message,
        });

        onSuccess();
    }, [
        state.success,
        state.message,
        onSuccess,
    ]);

    return (
        <form
            action={formAction}
            className="space-y-5"
        >
            <input
                type="hidden"
                name="id"
                value={router.id}
            />

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
                    <Label htmlFor={`router-name-${router.id}`}>
                        Nama Router
                    </Label>

                    <Input
                        id={`router-name-${router.id}`}
                        name="name"
                        defaultValue={router.name}
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.name,
                        )}
                    />

                    <FieldError
                        message={
                            state.errors?.name?.[0]
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`router-host-${router.id}`}>
                        Host / IP
                    </Label>

                    <Input
                        id={`router-host-${router.id}`}
                        name="host"
                        defaultValue={router.host}
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.host,
                        )}
                    />

                    <FieldError
                        message={
                            state.errors?.host?.[0]
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`router-port-${router.id}`}>
                        Port
                    </Label>

                    <Input
                        id={`router-port-${router.id}`}
                        name="port"
                        type="number"
                        min={1}
                        max={65535}
                        defaultValue={router.port}
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.port,
                        )}
                    />

                    <FieldError
                        message={
                            state.errors?.port?.[0]
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`router-username-${router.id}`}>
                        Username
                    </Label>

                    <Input
                        id={`router-username-${router.id}`}
                        name="username"
                        defaultValue={
                            router.username
                        }
                        autoComplete="off"
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.username,
                        )}
                    />

                    <FieldError
                        message={
                            state.errors
                                ?.username?.[0]
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`router-password-${router.id}`}>
                        Password Baru
                    </Label>

                    <Input
                        id={`router-password-${router.id}`}
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Kosongkan jika tidak diubah"
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors?.password,
                        )}
                    />

                    <FieldError
                        message={
                            state.errors
                                ?.password?.[0]
                        }
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`router-description-${router.id}`}>
                        Deskripsi
                    </Label>

                    <Input
                        id={`router-description-${router.id}`}
                        name="description"
                        defaultValue={
                            router.description ?? ""
                        }
                        disabled={isPending}
                        aria-invalid={Boolean(
                            state.errors
                                ?.description,
                        )}
                    />

                    <FieldError
                        message={
                            state.errors
                                ?.description?.[0]
                        }
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="min-w-0">
                    <Label htmlFor={`router-https-${router.id}`}>
                        Gunakan HTTPS
                    </Label>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Digunakan saat koneksi
                        membutuhkan HTTPS.
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
                    id={`router-https-${router.id}`}
                    checked={useHttps}
                    onCheckedChange={setUseHttps}
                    disabled={isPending}
                />
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isPending}
                >
                    Batal
                </Button>

                <Button
                    type="submit"
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Save />
                    )}

                    {isPending
                        ? "Menyimpan..."
                        : "Simpan Perubahan"}
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