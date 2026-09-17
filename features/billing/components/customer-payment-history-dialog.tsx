"use client";

import {
    useState,
    useTransition,
} from "react";
import {
    History,
    Loader2,
} from "lucide-react";

import {
    getCustomerPaymentHistoryAction,
} from "../actions/payment.action";
import {
    formatCurrency,
} from "../utils/format-currency";

import {
    Badge,
} from "@/components/ui/badge";
import {
    Button,
} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    EditPaymentDialog,
} from "./edit-payment-dialog";

// ============================================================================
// Types
// ============================================================================

type PaymentHistoryItem = {
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
    invoiceId: number;
    invoiceNumber: string;
    invoiceDescription: string;
};

type HistoryData = {
    payments:
    PaymentHistoryItem[];
    totalSuccess: number;
    successCount: number;
    totalRecords: number;
};

type Props = {
    customer: {
        id: number;
        name: string;
    };
    period?: string;
};

// ============================================================================
// Helpers
// ============================================================================

function formatDate(
    value: string,
) {
    const [year, month, day] =
        value.split("-").map(Number);

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        },
    ).format(
        new Date(
            year,
            month - 1,
            day,
        ),
    );
}

function paymentMethodLabel(
    method:
        PaymentHistoryItem["method"],
) {
    switch (method) {
        case "CASH":
            return "Tunai";
        case "TRANSFER":
            return "Transfer";
        case "QRIS":
            return "QRIS";
        case "EWALLET":
            return "E-Wallet";
        default:
            return "Lainnya";
    }
}

// ============================================================================
// Component
// ============================================================================

export function CustomerPaymentHistoryDialog({
    customer,
    period,
}: Props) {
    const [open, setOpen] =
        useState(false);

    const [data, setData] =
        useState<HistoryData | null>(
            null,
        );

    const [error, setError] =
        useState<string | null>(
            null,
        );

    const [
        isPending,
        startTransition,
    ] = useTransition();

    // ==========================================================================
    // Load History
    // ==========================================================================

    function loadHistory() {
        setError(null);

        startTransition(
            async () => {
                const result =
                    await getCustomerPaymentHistoryAction({
                        customerId:
                            customer.id,
                        period,
                    });

                if (!result.success) {
                    setData(null);
                    setError(
                        result.message,
                    );
                    return;
                }

                setData(
                    result.data,
                );
            },
        );
    }

    function handleOpen() {
        setOpen(true);
        setData(null);
        loadHistory();
    }

    return (
        <>
            {/* History Button */}
            <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={
                    handleOpen
                }
            >
                <History />
                Riwayat
            </Button>

            {/* History Dialog */}
            <Dialog
                open={open}
                onOpenChange={
                    setOpen
                }
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Riwayat Pembayaran
                        </DialogTitle>

                        <DialogDescription>
                            {customer.name}
                            {period
                                ? ` · ${period}`
                                : " · Semua periode"}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Loading */}
                    {isPending && (
                        <div className="flex min-h-40 items-center justify-center">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Error */}
                    {!isPending &&
                        error && (
                            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                    {/* Data */}
                    {!isPending &&
                        data && (
                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    <div className="rounded-lg border p-3">
                                        <p className="text-sm text-muted-foreground">
                                            Total Dibayar
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {formatCurrency(
                                                data.totalSuccess,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border p-3">
                                        <p className="text-sm text-muted-foreground">
                                            Pembayaran
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {
                                                data.successCount
                                            }
                                        </p>
                                    </div>

                                    <div className="col-span-2 rounded-lg border p-3 sm:col-span-1">
                                        <p className="text-sm text-muted-foreground">
                                            Semua Riwayat
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {
                                                data.totalRecords
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Empty */}
                                {data.payments
                                    .length ===
                                    0 && (
                                        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
                                            Belum ada pembayaran.
                                        </div>
                                    )}

                                {/* Desktop Table */}
                                {data.payments
                                    .length >
                                    0 && (
                                        <div className="hidden overflow-hidden rounded-lg border md:block">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="border-b bg-muted/40">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-medium">
                                                                Tanggal
                                                            </th>

                                                            <th className="px-4 py-3 text-left font-medium">
                                                                Pembayaran
                                                            </th>

                                                            <th className="px-4 py-3 text-left font-medium">
                                                                Invoice
                                                            </th>

                                                            <th className="px-4 py-3 text-left font-medium">
                                                                Metode
                                                            </th>

                                                            <th className="px-4 py-3 text-right font-medium">
                                                                Nominal
                                                            </th>

                                                            <th className="px-4 py-3 text-left font-medium">
                                                                Status
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium">
                                                                Aksi
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {data.payments.map(
                                                            (
                                                                payment,
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        payment.id
                                                                    }
                                                                    className="border-b last:border-0"
                                                                >
                                                                    <td className="px-4 py-3">
                                                                        {formatDate(
                                                                            payment.paymentDate,
                                                                        )}
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        <p className="font-medium">
                                                                            {
                                                                                payment.paymentNumber
                                                                            }
                                                                        </p>

                                                                        {payment.referenceNumber && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Ref:{" "}
                                                                                {
                                                                                    payment.referenceNumber
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        <p className="font-medium">
                                                                            {
                                                                                payment.invoiceNumber
                                                                            }
                                                                        </p>

                                                                        <p className="max-w-52 truncate text-xs text-muted-foreground">
                                                                            {
                                                                                payment.invoiceDescription
                                                                            }
                                                                        </p>
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        {paymentMethodLabel(
                                                                            payment.method,
                                                                        )}
                                                                    </td>

                                                                    <td className="px-4 py-3 text-right font-medium">
                                                                        {formatCurrency(
                                                                            payment.amount,
                                                                        )}
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        <Badge
                                                                            variant={
                                                                                payment.status ===
                                                                                    "SUCCESS"
                                                                                    ? "default"
                                                                                    : "secondary"
                                                                            }
                                                                        >
                                                                            {payment.status ===
                                                                                "SUCCESS"
                                                                                ? "Berhasil"
                                                                                : "Dibatalkan"}
                                                                        </Badge>
                                                                    </td>

                                                                    <td className="px-4 py-3 text-right">
                                                                        <EditPaymentDialog
                                                                            payment={{
                                                                                id:
                                                                                    payment.id,
                                                                                paymentNumber:
                                                                                    payment.paymentNumber,
                                                                                paymentDate:
                                                                                    payment.paymentDate,
                                                                                amount:
                                                                                    payment.amount,
                                                                                method:
                                                                                    payment.method,
                                                                                referenceNumber:
                                                                                    payment.referenceNumber,
                                                                                notes:
                                                                                    payment.notes,
                                                                                status:
                                                                                    payment.status,
                                                                            }}
                                                                            onUpdated={
                                                                                loadHistory
                                                                            }
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                {/* Mobile */}
                                <div className="space-y-3 md:hidden">
                                    {data.payments.map(
                                        (
                                            payment,
                                        ) => (
                                            <div
                                                key={
                                                    payment.id
                                                }
                                                className="rounded-lg border p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {
                                                                payment.invoiceNumber
                                                            }
                                                        </p>

                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(
                                                                payment.paymentDate,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <Badge
                                                        variant={
                                                            payment.status ===
                                                                "SUCCESS"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {payment.status ===
                                                            "SUCCESS"
                                                            ? "Berhasil"
                                                            : "Dibatalkan"}
                                                    </Badge>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">
                                                            Metode
                                                        </p>

                                                        <p className="font-medium">
                                                            {paymentMethodLabel(
                                                                payment.method,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-muted-foreground">
                                                            Nominal
                                                        </p>

                                                        <p className="font-semibold">
                                                            {formatCurrency(
                                                                payment.amount,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                                                    <p>
                                                        {
                                                            payment.paymentNumber
                                                        }
                                                    </p>

                                                    {payment.referenceNumber && (
                                                        <p>
                                                            Ref:{" "}
                                                            {
                                                                payment.referenceNumber
                                                            }
                                                        </p>
                                                    )}

                                                    {payment.notes && (
                                                        <p className="mt-1">
                                                            {
                                                                payment.notes
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-4 border-t pt-3">
                                                    <EditPaymentDialog
                                                        payment={{
                                                            id:
                                                                payment.id,
                                                            paymentNumber:
                                                                payment.paymentNumber,
                                                            paymentDate:
                                                                payment.paymentDate,
                                                            amount:
                                                                payment.amount,
                                                            method:
                                                                payment.method,
                                                            referenceNumber:
                                                                payment.referenceNumber,
                                                            notes:
                                                                payment.notes,
                                                            status:
                                                                payment.status,
                                                        }}
                                                        onUpdated={
                                                            loadHistory
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                </DialogContent>
            </Dialog>
        </>
    );
}