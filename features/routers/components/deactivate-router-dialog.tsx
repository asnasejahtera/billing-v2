"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import {
    Loader2,
    Trash2,
    TriangleAlert,
} from "lucide-react";
import { deactivateRouterAction } from "@/features/routers/actions/deactivate-router.action";
import { initialDeactivateRouterState } from "@/features/routers/types/deactivate-router-action-state";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";

type DeactivateRouterDialogProps = {
    router: {
        id: number;
        name: string;
        isActive: boolean;
    };
    open?: boolean;
    onOpenChange?: (
        open: boolean,
    ) => void;
    showTrigger?: boolean;
};

export function DeactivateRouterDialog({
    router,
    open,
    onOpenChange,
    showTrigger = true,
}: DeactivateRouterDialogProps) {
    const [
        internalOpen,
        setInternalOpen,
    ] = useState(false);

    const [formKey, setFormKey] =
        useState(0);

    const resolvedOpen =
        open ?? internalOpen;

    const setResolvedOpen =
        onOpenChange ??
        setInternalOpen;

    useEffect(() => {
        if (resolvedOpen) {
            setFormKey(
                (current) =>
                    current + 1,
            );
        }
    }, [resolvedOpen]);

    function handleOpen() {
        setResolvedOpen(true);
    }
    return (
        <>
            {showTrigger && (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleOpen}
                    disabled={!router.isActive}
                >
                    <Trash2 />
                    Hapus
                </Button>
            )}

            <AlertDialog
                open={resolvedOpen}
                onOpenChange={setResolvedOpen}
            >
                <AlertDialogContent
                    size="sm"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >
                    <AlertDialogHeader>
                        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <TriangleAlert className="size-5" />
                        </div>

                        <AlertDialogTitle>
                            Nonaktifkan Router?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Router{" "}
                            <span className="font-medium text-foreground">
                                {router.name}
                            </span>{" "}
                            akan dinonaktifkan. Data router
                            tidak dihapus dari database dan
                            dapat tetap digunakan sebagai
                            referensi histori.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <DeactivateRouterForm
                        key={formKey}
                        routerId={router.id}
                        onSuccess={() =>
                            setResolvedOpen(false)
                        }
                    />
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

type DeactivateRouterFormProps = {
    routerId: number;
    onSuccess: () => void;
};

function DeactivateRouterForm({
    routerId,
    onSuccess,
}: DeactivateRouterFormProps) {
    const [state, formAction, isPending] =
        useActionState(
            deactivateRouterAction,
            initialDeactivateRouterState,
        );

    useEffect(() => {
        if (!state.success) {
            return;
        }

        toast.add({
            type: "success",
            title:
                "Router dinonaktifkan",
            description: state.message,
        });

        onSuccess();
    }, [
        state.success,
        state.message,
        onSuccess,
    ]);

    return (
        <form action={formAction}>
            <input
                type="hidden"
                name="id"
                value={routerId}
            />

            {state.success === false &&
                state.message && (
                    <div
                        role="alert"
                        className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                        {state.message}
                    </div>
                )}

            <AlertDialogFooter>
                <AlertDialogCancel
                    disabled={isPending}
                >
                    Batal
                </AlertDialogCancel>

                <Button
                    type="submit"
                    variant="destructive"
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Trash2 />
                    )}

                    {isPending
                        ? "Menonaktifkan..."
                        : "Ya, Nonaktifkan"}
                </Button>
            </AlertDialogFooter>
        </form>
    );
}