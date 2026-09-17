"use client";

import {
    useState,
    useTransition,
} from "react";
import {
    Loader2,
    Pencil,
    Trash2,
} from "lucide-react";

import {
    deleteInvoiceAction,
    editInvoiceAction,
} from "../actions/invoice-mutation.action";
import {
    Button,
} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Input,
} from "@/components/ui/input";
import {
    Label,
} from "@/components/ui/label";
import {
    Textarea,
} from "@/components/ui/textarea";

// ============================================================================
// Types
// ============================================================================

type InvoiceRowActionData = {
    id: number;
    invoiceNumber: string;
    description: string;
    notes: string | null;
    total: string;
    invoiceDate: string;
    dueDate: string;
    status:
    | "UNPAID"
    | "PARTIAL"
    | "PAID"
    | "VOID";
};

type Props = {
    invoice: InvoiceRowActionData;
};

// ============================================================================
// Component
// ============================================================================

export function InvoiceRowActions({
    invoice,
}: Props) {
    const editable =
        invoice.status === "UNPAID";

    const [
        editOpen,
        setEditOpen,
    ] = useState(false);

    const [
        deleteOpen,
        setDeleteOpen,
    ] = useState(false);

    const [
        description,
        setDescription,
    ] = useState(
        invoice.description,
    );

    const [
        amount,
        setAmount,
    ] = useState(
        Number(
            invoice.total,
        ).toString(),
    );

    const [
        invoiceDate,
        setInvoiceDate,
    ] = useState(
        invoice.invoiceDate,
    );

    const [
        dueDate,
        setDueDate,
    ] = useState(
        invoice.dueDate,
    );

    const [
        notes,
        setNotes,
    ] = useState(
        invoice.notes ?? "",
    );

    const [
        reason,
        setReason,
    ] = useState("");

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
    // Edit
    // ==========================================================================

    function handleEdit() {
        setError(null);

        startTransition(
            async () => {
                const result =
                    await editInvoiceAction({
                        id:
                            invoice.id,
                        description,
                        amount,
                        invoiceDate,
                        dueDate,
                        notes,
                    });

                if (!result.success) {
                    setError(
                        result.message,
                    );
                    return;
                }

                setEditOpen(false);
            },
        );
    }

    // ==========================================================================
    // Delete
    // ==========================================================================

    function handleDelete() {
        setError(null);

        startTransition(
            async () => {
                const result =
                    await deleteInvoiceAction({
                        id:
                            invoice.id,
                        reason,
                    });

                if (!result.success) {
                    setError(
                        result.message,
                    );
                    return;
                }

                setDeleteOpen(false);
                setReason("");
            },
        );
    }

    return (
        <>
            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!editable}
                    onClick={() => {
                        setError(null);
                        setEditOpen(true);
                    }}
                >
                    <Pencil />
                    Edit
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={!editable}
                    onClick={() => {
                        setError(null);
                        setDeleteOpen(true);
                    }}
                >
                    <Trash2 />
                    Hapus
                </Button>
            </div>

            {/* ================================================================ */}
            {/* Edit Dialog */}
            {/* ================================================================ */}

            <Dialog
                open={editOpen}
                onOpenChange={
                    setEditOpen
                }
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Invoice
                        </DialogTitle>

                        <DialogDescription>
                            {
                                invoice.invoiceNumber
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Description */}
                        <div className="space-y-2">
                            <Label>
                                Deskripsi
                            </Label>

                            <Input
                                value={
                                    description
                                }
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setDescription(
                                        event.target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label>
                                Nominal
                            </Label>

                            <Input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                    amount
                                }
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setAmount(
                                        event.target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>
                                    Tanggal Invoice
                                </Label>

                                <Input
                                    type="date"
                                    value={
                                        invoiceDate
                                    }
                                    disabled={
                                        isPending
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setInvoiceDate(
                                            event.target
                                                .value,
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Jatuh Tempo
                                </Label>

                                <Input
                                    type="date"
                                    value={
                                        dueDate
                                    }
                                    disabled={
                                        isPending
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setDueDate(
                                            event.target
                                                .value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>
                                Catatan
                            </Label>

                            <Textarea
                                value={notes}
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setNotes(
                                        event.target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        {/* Error */}
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
                            disabled={
                                isPending
                            }
                            onClick={() =>
                                setEditOpen(
                                    false,
                                )
                            }
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                isPending ||
                                !description ||
                                !amount ||
                                !invoiceDate ||
                                !dueDate
                            }
                            onClick={
                                handleEdit
                            }
                        >
                            {isPending && (
                                <Loader2 className="animate-spin" />
                            )}

                            {isPending
                                ? "Menyimpan..."
                                : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================ */}
            {/* Delete Alert */}
            {/* ================================================================ */}

            <AlertDialog
                open={deleteOpen}
                onOpenChange={
                    setDeleteOpen
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus Invoice?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Invoice{" "}
                            <strong>
                                {
                                    invoice.invoiceNumber
                                }
                            </strong>{" "}
                            akan dibatalkan dan
                            tidak ditampilkan pada
                            daftar billing normal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2">
                        <Label>
                            Alasan
                        </Label>

                        <Textarea
                            value={reason}
                            disabled={
                                isPending
                            }
                            placeholder="Contoh: Invoice salah dibuat"
                            onChange={(
                                event,
                            ) =>
                                setReason(
                                    event.target
                                        .value,
                                )
                            }
                        />

                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                isPending
                            }
                            onClick={() =>
                                setDeleteOpen(
                                    false,
                                )
                            }
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                isPending ||
                                reason.trim()
                                    .length < 3
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
                                : "Hapus Invoice"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}