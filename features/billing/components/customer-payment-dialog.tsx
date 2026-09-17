"use client";

import {
    useState,
    useTransition,
} from "react";
import {
    Banknote,
    Loader2,
} from "lucide-react";

import {
    createPaymentAction,
    getCustomerOutstandingInvoicesAction,
} from "../actions/payment.action";
import {
    formatCurrency,
} from "../utils/format-currency";

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

// ============================================================================
// Types
// ============================================================================

type InvoiceOption = {
    id: number;
    invoiceNumber: string;
    description: string;
    invoiceDate: string;
    dueDate: string;
    total: string;
    paidAmount: string;
    remainingAmount: string;
    status:
    | "UNPAID"
    | "PARTIAL"
    | "PAID"
    | "VOID";
};

type Props = {
    customer: {
        id: number;
        name: string;
        outstanding: string;
    };
    period?: string;
};

// ============================================================================
// Date
// ============================================================================

function getLocalDate() {
    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1,
        ).padStart(2, "0");

    const day =
        String(
            date.getDate(),
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ============================================================================
// Component
// ============================================================================

export function CustomerPaymentDialog({
    customer,
    period,
}: Props) {
    const [open, setOpen] =
        useState(false);

    const [invoices, setInvoices] =
        useState<InvoiceOption[]>([]);

    const [invoiceId, setInvoiceId] =
        useState("");

    const [amount, setAmount] =
        useState("");

    const [paymentDate, setPaymentDate] =
        useState(
            getLocalDate(),
        );

    const [method, setMethod] =
        useState<
            | "CASH"
            | "TRANSFER"
            | "QRIS"
            | "EWALLET"
            | "OTHER"
        >("CASH");

    const [
        referenceNumber,
        setReferenceNumber,
    ] = useState("");

    const [notes, setNotes] =
        useState("");

    const [message, setMessage] =
        useState<string | null>(null);

    const [
        isPending,
        startTransition,
    ] = useTransition();

    const selectedInvoice =
        invoices.find(
            (invoice) =>
                String(invoice.id) ===
                invoiceId,
        );

    // ==========================================================================
    // Load Invoice
    // ==========================================================================

    function loadInvoices() {
        setMessage(null);

        startTransition(
            async () => {
                const result =
                    await getCustomerOutstandingInvoicesAction({
                        customerId:
                            customer.id,
                        period,
                    });

                if (!result.success) {
                    setInvoices([]);
                    setMessage(
                        result.message,
                    );
                    return;
                }

                setInvoices(
                    result.data,
                );

                if (
                    result.data.length ===
                    1
                ) {
                    const invoice =
                        result.data[0];

                    setInvoiceId(
                        String(
                            invoice.id,
                        ),
                    );

                    setAmount(
                        String(
                            Number(
                                invoice.remainingAmount,
                            ),
                        ),
                    );
                } else {
                    setInvoiceId("");
                    setAmount("");
                }
            },
        );
    }

    // ==========================================================================
    // Open
    // ==========================================================================

    function handleOpen() {
        setOpen(true);
        loadInvoices();
    }

    // ==========================================================================
    // Invoice Change
    // ==========================================================================

    function handleInvoiceChange(
        value: string,
    ) {
        setInvoiceId(value);
        setMessage(null);

        const invoice =
            invoices.find(
                (item) =>
                    String(item.id) ===
                    value,
            );

        setAmount(
            invoice
                ? String(
                    Number(
                        invoice.remainingAmount,
                    ),
                )
                : "",
        );
    }

    // ==========================================================================
    // Submit
    // ==========================================================================

    function handlePayment() {
        if (!selectedInvoice) {
            return;
        }

        setMessage(null);

        startTransition(
            async () => {
                const result =
                    await createPaymentAction({
                        invoiceId:
                            selectedInvoice.id,
                        amount,
                        paymentDate,
                        method,
                        referenceNumber,
                        notes,
                    });

                if (!result.success) {
                    setMessage(
                        result.message,
                    );
                    return;
                }

                setMessage(
                    result.message,
                );

                setReferenceNumber("");
                setNotes("");

                // Reload sisa invoice setelah pembayaran.
                const refreshed =
                    await getCustomerOutstandingInvoicesAction({
                        customerId:
                            customer.id,
                        period,
                    });

                if (refreshed.success) {
                    setInvoices(
                        refreshed.data,
                    );

                    setInvoiceId("");
                    setAmount("");
                }
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
                disabled={
                    Number(
                        customer.outstanding,
                    ) <= 0
                }
                onClick={
                    handleOpen
                }
            >
                <Banknote />
                Bayar
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
                            Pembayaran
                        </DialogTitle>

                        <DialogDescription>
                            {customer.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Customer Summary */}
                        <div className="rounded-lg border p-3">
                            <p className="text-sm text-muted-foreground">
                                Total kurang bayar
                            </p>

                            <p className="text-xl font-semibold">
                                {formatCurrency(
                                    customer.outstanding,
                                )}
                            </p>
                        </div>

                        {/* Invoice */}
                        <div className="space-y-2">
                            <Label>
                                Invoice
                            </Label>

                            <select
                                value={
                                    invoiceId
                                }
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    handleInvoiceChange(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">
                                    Pilih invoice
                                </option>

                                {invoices.map(
                                    (invoice) => (
                                        <option
                                            key={
                                                invoice.id
                                            }
                                            value={
                                                invoice.id
                                            }
                                        >
                                            {
                                                invoice.invoiceNumber
                                            }{" "}
                                            —{" "}
                                            {formatCurrency(
                                                invoice.remainingAmount,
                                            )}
                                        </option>
                                    ),
                                )}
                            </select>

                            {!isPending &&
                                invoices.length ===
                                0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada invoice
                                        yang masih memiliki
                                        sisa tagihan.
                                    </p>
                                )}
                        </div>

                        {/* Invoice Summary */}
                        {selectedInvoice && (
                            <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">
                                        Tagihan
                                    </p>

                                    <p className="font-medium">
                                        {formatCurrency(
                                            selectedInvoice.total,
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-muted-foreground">
                                        Dibayar
                                    </p>

                                    <p className="font-medium">
                                        {formatCurrency(
                                            selectedInvoice.paidAmount,
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-muted-foreground">
                                        Sisa
                                    </p>

                                    <p className="font-semibold">
                                        {formatCurrency(
                                            selectedInvoice.remainingAmount,
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label>
                                Jumlah Bayar
                            </Label>

                            <Input
                                type="number"
                                min="1"
                                max={
                                    selectedInvoice
                                        ? Number(
                                            selectedInvoice.remainingAmount,
                                        )
                                        : undefined
                                }
                                value={amount}
                                disabled={
                                    isPending ||
                                    !selectedInvoice
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

                            {selectedInvoice && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                        isPending
                                    }
                                    onClick={() =>
                                        setAmount(
                                            String(
                                                Number(
                                                    selectedInvoice.remainingAmount,
                                                ),
                                            ),
                                        )
                                    }
                                >
                                    Bayar Lunas
                                </Button>
                            )}
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
                                placeholder="Opsional"
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
                                placeholder="Opsional"
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

                        {/* Message */}
                        {message && (
                            <div className="rounded-lg border p-3 text-sm">
                                {message}
                            </div>
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
                            Tutup
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                isPending ||
                                !selectedInvoice ||
                                !amount ||
                                Number(amount) <= 0
                            }
                            onClick={
                                handlePayment
                            }
                        >
                            {isPending && (
                                <Loader2 className="animate-spin" />
                            )}

                            {isPending
                                ? "Menyimpan..."
                                : "Simpan Pembayaran"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}