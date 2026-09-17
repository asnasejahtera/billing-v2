import {
    Banknote,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    ReceiptText,
    TriangleAlert,
} from "lucide-react";

import {
    formatCurrency,
} from "../utils/format-currency";

// ============================================================================
// Types
// ============================================================================

type Props = {
    summary: {
        invoiceCount: number;
        unpaidInvoiceCount: number;
        paidInvoiceCount: number;
        unpaidCustomerCount: number;
        paidCustomerCount: number;

        totalInvoice: string;
        totalPaid: string;
        outstanding: string;
        overdue: string;
    };
};

// ============================================================================
// Component
// ============================================================================

export function PaymentSummary({
    summary,
}: Props) {
    return (
        <div className="space-y-3">
            {/* ================================================================== */}
            {/* Financial Summary */}
            {/* ================================================================== */}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {/* Total Tagihan */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Total Tagihan
                        </p>

                        <ReceiptText className="size-4 text-muted-foreground" />
                    </div>

                    <p className="mt-2 text-xl font-semibold">
                        {formatCurrency(
                            summary.totalInvoice,
                        )}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {summary.invoiceCount} invoice
                    </p>
                </div>

                {/* Sudah Dibayar */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Sudah Dibayar
                        </p>

                        <Banknote className="size-4 text-muted-foreground" />
                    </div>

                    <p className="mt-2 text-xl font-semibold">
                        {formatCurrency(
                            summary.totalPaid,
                        )}
                    </p>
                </div>

                {/* Kurang Bayar */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Kurang Bayar
                        </p>

                        <CircleDollarSign className="size-4 text-muted-foreground" />
                    </div>

                    <p className="mt-2 text-xl font-semibold">
                        {formatCurrency(
                            summary.outstanding,
                        )}
                    </p>
                </div>

                {/* Tunggakan */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Tunggakan
                        </p>

                        <TriangleAlert className="size-4 text-destructive" />
                    </div>

                    <p className="mt-2 text-xl font-semibold text-destructive">
                        {formatCurrency(
                            summary.overdue,
                        )}
                    </p>
                </div>
            </div>

            {/* ================================================================== */}
            {/* Invoice / Customer Status Summary */}
            {/* ================================================================== */}

            <div className="grid gap-3 sm:grid-cols-2">
                {/* Belum Bayar */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Belum Bayar
                        </p>

                        <Clock3 className="size-4 text-muted-foreground" />
                    </div>

                    <div className="mt-2 flex items-end gap-2">
                        <p className="text-2xl font-semibold">
                            {summary.unpaidInvoiceCount}
                        </p>

                        <p className="pb-1 text-sm text-muted-foreground">
                            invoice
                        </p>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {summary.unpaidCustomerCount} pelanggan
                    </p>
                </div>

                {/* Lunas */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Lunas
                        </p>

                        <CheckCircle2 className="size-4 text-muted-foreground" />
                    </div>

                    <div className="mt-2 flex items-end gap-2">
                        <p className="text-2xl font-semibold">
                            {summary.paidInvoiceCount}
                        </p>

                        <p className="pb-1 text-sm text-muted-foreground">
                            invoice
                        </p>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {summary.paidCustomerCount} pelanggan
                    </p>
                </div>
            </div>
        </div>
    );
}