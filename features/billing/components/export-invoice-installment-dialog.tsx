"use client";

import {
    useState,
} from "react";
import {
    Download,
    Loader2,
} from "lucide-react";

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
    Label,
} from "@/components/ui/label";

// ============================================================================
// Helpers
// ============================================================================

function currentMonth() {
    const now =
        new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}`;
}

// ============================================================================
// Component
// ============================================================================

export function ExportInvoiceInstallmentDialog() {
    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        month,
        setMonth,
    ] = useState(
        currentMonth(),
    );

    const [
        isPending,
        setIsPending,
    ] = useState(false);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null,
        );

    // ==========================================================================
    // Export
    // ==========================================================================

    async function handleExport() {
        if (!month) {
            setError(
                "Pilih bulan.",
            );
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            const params =
                new URLSearchParams({
                    month,
                });

            const response =
                await fetch(
                    `/api/billing/payments/export-invoice-installment?${params.toString()}`,
                );

            if (!response.ok) {
                const result =
                    await response
                        .json()
                        .catch(() => null);

                throw new Error(
                    result?.message ??
                    "Gagal membuat Excel.",
                );
            }

            const blob =
                await response.blob();

            const url =
                URL.createObjectURL(
                    blob,
                );

            const link =
                document.createElement(
                    "a",
                );

            link.href =
                url;

            link.download =
                `invoice-angsuran-${month}.xlsx`;

            document.body.appendChild(
                link,
            );

            link.click();
            link.remove();

            URL.revokeObjectURL(
                url,
            );

            setOpen(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Gagal export Excel.",
            );
        } finally {
            setIsPending(false);
        }
    }

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={() => {
                    setError(null);
                    setOpen(true);
                }}
            >
                <Download />
                Export Invoice
            </Button>

            <Dialog
                open={open}
                onOpenChange={
                    setOpen
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Export Invoice Angsuran
                        </DialogTitle>

                        <DialogDescription>
                            Pilih bulan invoice yang
                            akan diexport.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoice-export-month">
                                Bulan Invoice
                            </Label>

                            <input
                                id="invoice-export-month"
                                type="month"
                                value={
                                    month
                                }
                                disabled={
                                    isPending
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setMonth(
                                        event.target.value,
                                    )
                                }
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            />
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                            Kolom Angsuran dibuat otomatis
                            berdasarkan jumlah pembayaran
                            terbanyak pada satu invoice.
                        </div>

                        {error && (
                            <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                                {error}
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
                            Batal
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                isPending ||
                                !month
                            }
                            onClick={
                                handleExport
                            }
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Download />
                            )}

                            {isPending
                                ? "Membuat Excel..."
                                : "Export Invoice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}