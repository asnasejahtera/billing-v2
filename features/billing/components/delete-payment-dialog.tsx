"use client";

import {
    useState,
    useTransition,
} from "react";
import {
    Loader2,
    Trash2,
} from "lucide-react";

import {
    deletePaymentAction,
} from "../actions/payment.action";

import {
    Button,
} from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// Types
// ============================================================================

type Props = {
    payment: {
        id: number;
        paymentNumber: string;
    };
    onDeleted: () => void;
};

// ============================================================================
// Component
// ============================================================================

export function DeletePaymentDialog({
    payment,
    onDeleted,
}: Props) {
    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null,
        );

    const [
        isPending,
        startTransition,
    ] = useTransition();

    // ==========================================================================
    // Delete
    // ==========================================================================

    function handleDelete() {
        setError(null);

        startTransition(
            async () => {
                const result =
                    await deletePaymentAction({
                        id:
                            payment.id,
                    });

                if (!result.success) {
                    setError(
                        result.message,
                    );
                    return;
                }

                setOpen(false);

                onDeleted();
            },
        );
    }

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <>
            <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                    setError(null);
                    setOpen(true);
                }}
            >
                <Trash2 />
                Hapus
            </Button>

            <AlertDialog
                open={open}
                onOpenChange={
                    setOpen
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus Pembayaran?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Pembayaran{" "}
                            <strong>
                                {
                                    payment.paymentNumber
                                }
                            </strong>{" "}
                            akan dihapus permanen.
                            Total pembayaran dan
                            status invoice akan
                            dihitung ulang.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {error && (
                        <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                isPending
                            }
                            onClick={() =>
                                setOpen(false)
                            }
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                isPending
                            }
                            onClick={
                                handleDelete
                            }
                        >
                            {isPending && (
                                <Loader2 className="animate-spin" />
                            )}

                            {isPending
                                ? "Menghapus..."
                                : "Hapus Pembayaran"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}