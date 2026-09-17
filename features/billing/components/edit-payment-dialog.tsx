"use client";

import {
    useState,
    useTransition,
} from "react";
import {
    Loader2,
    Pencil,
} from "lucide-react";

import {
    editPaymentAction,
} from "../actions/payment.action";

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

type PaymentData = {
    id: number;
    paymentNumber: string;
    paymentDate: string;
    amount: string;
    method:
    | "CASH"
    | "TRANSFER"
    | "QRIS"
    | "EWALLET"
    | "OTHER";
    referenceNumber: string | null;
    notes: string | null;
    status:
    | "SUCCESS"
    | "VOID";
};

type Props = {
    payment: PaymentData;
    onUpdated: () => void;
};

// ============================================================================
// Component
// ============================================================================

export function EditPaymentDialog({
    payment,
    onUpdated,
}: Props) {
    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        amount,
        setAmount,
    ] = useState(
        Number(
            payment.amount,
        ).toString(),
    );

    const [
        paymentDate,
        setPaymentDate,
    ] = useState(
        payment.paymentDate,
    );

    const [
        method,
        setMethod,
    ] = useState(
        payment.method,
    );

    const [
        referenceNumber,
        setReferenceNumber,
    ] = useState(
        payment.referenceNumber ??
        "",
    );

    const [
        notes,
        setNotes,
    ] = useState(
        payment.notes ?? "",
    );

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
    // Submit
    // ==========================================================================

    function handleSubmit() {
        setError(null);

        startTransition(
            async () => {
                const result =
                    await editPaymentAction({
                        id:
                            payment.id,
                        amount,
                        paymentDate,
                        method,
                        referenceNumber,
                        notes,
                    });

                if (!result.success) {
                    setError(
                        result.message,
                    );
                    return;
                }

                setOpen(false);
                onUpdated();
            },
        );
    }

    return (
        <>
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                    payment.status !==
                    "SUCCESS"
                }
                onClick={() => {
                    setError(null);
                    setOpen(true);
                }}
            >
                <Pencil />
                Edit
            </Button>

            <Dialog
                open={open}
                onOpenChange={
                    setOpen
                }
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Pembayaran
                        </DialogTitle>

                        <DialogDescription>
                            {
                                payment.paymentNumber
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label>
                                Jumlah Bayar
                            </Label>

                            <Input
                                type="number"
                                min="1"
                                step="1"
                                value={amount}
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

                        {/* Date */}
                        <div className="space-y-2">
                            <Label>
                                Tanggal Pembayaran
                            </Label>

                            <Input
                                type="date"
                                value={
                                    paymentDate
                                }
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setPaymentDate(
                                        event.target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        {/* Method */}
                        <div className="space-y-2">
                            <Label>
                                Metode
                            </Label>

                            <select
                                value={method}
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setMethod(
                                        event.target
                                            .value as typeof method,
                                    )
                                }
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="CASH">
                                    Tunai
                                </option>

                                <option value="TRANSFER">
                                    Transfer
                                </option>

                                <option value="QRIS">
                                    QRIS
                                </option>

                                <option value="EWALLET">
                                    E-Wallet
                                </option>

                                <option value="OTHER">
                                    Lainnya
                                </option>
                            </select>
                        </div>

                        {/* Reference */}
                        <div className="space-y-2">
                            <Label>
                                Nomor Referensi
                            </Label>

                            <Input
                                value={
                                    referenceNumber
                                }
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setReferenceNumber(
                                        event.target
                                            .value,
                                    )
                                }
                            />
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
                                setOpen(false)
                            }
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                isPending ||
                                !amount ||
                                Number(amount) <= 0 ||
                                !paymentDate
                            }
                            onClick={
                                handleSubmit
                            }
                        >
                            {isPending && (
                                <Loader2 className="animate-spin" />
                            )}

                            {isPending
                                ? "Menyimpan..."
                                : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}