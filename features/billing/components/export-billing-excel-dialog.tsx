"use client";

import {
    useState,
} from "react";
import {
    Download,
    Loader2,
    Plus,
    X,
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

function getCurrentMonth() {
    const now =
        new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}`;
}

function monthLabel(
    month: string,
) {
    const [
        year,
        monthNumber,
    ] =
        month
            .split("-")
            .map(Number);

    const label =
        new Intl.DateTimeFormat(
            "id-ID",
            {
                month:
                    "long",
                year:
                    "numeric",
            },
        ).format(
            new Date(
                year,
                monthNumber -
                1,
                1,
            ),
        );

    return (
        label.charAt(0).toUpperCase() +
        label.slice(1)
    );
}

// ============================================================================
// Component
// ============================================================================

export function ExportBillingExcelDialog() {
    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        monthInput,
        setMonthInput,
    ] = useState(
        getCurrentMonth(),
    );

    const [
        months,
        setMonths,
    ] = useState<string[]>(
        [],
    );

    const [
        isExporting,
        setIsExporting,
    ] = useState(false);

    const [
        error,
        setError,
    ] =
        useState<
            string | null
        >(null);

    // ==========================================================================
    // Add Month
    // ==========================================================================

    function addMonth() {
        if (!monthInput) {
            return;
        }

        setMonths(
            (current) =>
                [
                    ...new Set([
                        ...current,
                        monthInput,
                    ]),
                ].sort(),
        );

        setError(null);
    }

    // ==========================================================================
    // Remove Month
    // ==========================================================================

    function removeMonth(
        month: string,
    ) {
        setMonths(
            (current) =>
                current.filter(
                    (item) =>
                        item !==
                        month,
                ),
        );
    }

    // ==========================================================================
    // Export
    // ==========================================================================

    async function handleExport() {
        if (
            months.length ===
            0
        ) {
            setError(
                "Pilih minimal satu bulan.",
            );

            return;
        }

        setIsExporting(
            true,
        );

        setError(
            null,
        );

        try {
            const params =
                new URLSearchParams();

            params.set(
                "months",
                months.join(","),
            );

            const response =
                await fetch(
                    `/api/billing/payments/export?${params.toString()}`,
                );

            if (!response.ok) {
                const result =
                    await response
                        .json()
                        .catch(
                            () => null,
                        );

                throw new Error(
                    result?.message ??
                    "Gagal membuat file Excel.",
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
                `billing-${months.join("_")}.xlsx`;

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
            setIsExporting(
                false,
            );
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
                    setError(
                        null,
                    );

                    setOpen(
                        true,
                    );
                }}
            >
                <Download />
                Export Excel
            </Button>

            <Dialog
                open={open}
                onOpenChange={
                    setOpen
                }
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Export Billing Excel
                        </DialogTitle>

                        <DialogDescription>
                            Pilih satu atau beberapa bulan
                            yang ingin dimasukkan ke laporan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* ============================================================ */}
                        {/* Month Picker */}
                        {/* ============================================================ */}

                        <div className="space-y-2">
                            <Label htmlFor="export-month">
                                Bulan
                            </Label>

                            <div className="flex gap-2">
                                <input
                                    id="export-month"
                                    type="month"
                                    value={
                                        monthInput
                                    }
                                    disabled={
                                        isExporting
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setMonthInput(
                                            event.target
                                                .value,
                                        )
                                    }
                                    className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        !monthInput ||
                                        isExporting
                                    }
                                    onClick={
                                        addMonth
                                    }
                                >
                                    <Plus />
                                    Tambah
                                </Button>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/* Selected Months */}
                        {/* ============================================================ */}

                        <div className="space-y-2">
                            <Label>
                                Bulan Dipilih
                            </Label>

                            {months.length ===
                                0 ? (
                                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    Belum ada bulan dipilih.
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 rounded-md border p-3">
                                    {months.map(
                                        (
                                            month,
                                        ) => (
                                            <div
                                                key={
                                                    month
                                                }
                                                className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm"
                                            >
                                                <span>
                                                    {
                                                        monthLabel(
                                                            month,
                                                        )
                                                    }
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        isExporting
                                                    }
                                                    aria-label={`Hapus ${monthLabel(month)}`}
                                                    onClick={() =>
                                                        removeMonth(
                                                            month,
                                                        )
                                                    }
                                                    className="rounded-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ============================================================ */}
                        {/* Information */}
                        {/* ============================================================ */}

                        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                            Setiap bulan berisi Total Tagihan,
                            Total Bayar, Tanggal Bayar Terakhir,
                            Kurang Bayar, Keterangan, dan
                            Tunggakan.
                        </div>

                        {/* ============================================================ */}
                        {/* Error */}
                        {/* ============================================================ */}

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
                                isExporting
                            }
                            onClick={() =>
                                setOpen(
                                    false,
                                )
                            }
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                isExporting ||
                                months.length ===
                                0
                            }
                            onClick={
                                handleExport
                            }
                        >
                            {isExporting ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Download />
                            )}

                            {isExporting
                                ? "Membuat Excel..."
                                : `Export ${months.length} Bulan`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}