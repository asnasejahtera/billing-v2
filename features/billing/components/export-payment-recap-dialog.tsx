"use client"

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

function currentMonth() {
    const now =
        new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}`;
}

function monthLabel(
    month: string,
) {
    const [year, value] =
        month
            .split("-")
            .map(Number);

    const label =
        new Intl.DateTimeFormat(
            "id-ID",
            {
                month: "long",
                year: "numeric",
            },
        ).format(
            new Date(
                year,
                value - 1,
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

export function ExportPaymentRecapDialog() {
    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        monthInput,
        setMonthInput,
    ] = useState(
        currentMonth(),
    );

    const [
        months,
        setMonths,
    ] = useState<string[]>(
        [],
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

        setIsPending(true);
        setError(null);

        try {
            const params =
                new URLSearchParams();

            params.set(
                "months",
                months.join(","),
            );

            const response =
                await fetch(
                    `/api/billing/payments/export-recap?${params.toString()}`,
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
                    "Gagal export rekap.",
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
                `rekap-pembayaran-${months.join("_")}.xlsx`;

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
                    : "Gagal export rekap.",
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
                Export Rekap
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
                            Export Rekap Pembayaran
                        </DialogTitle>

                        <DialogDescription>
                            Pilih bulan yang akan dijadikan
                            kolom riwayat pembayaran.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>
                                Tambah Bulan
                            </Label>

                            <div className="flex gap-2">
                                <input
                                    type="month"
                                    value={
                                        monthInput
                                    }
                                    disabled={
                                        isPending
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
                                        isPending ||
                                        !monthInput
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

                        <div className="space-y-2">
                            <Label>
                                Bulan Dipilih
                            </Label>

                            {months.length ===
                                0 ? (
                                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    Belum ada bulan.
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
                                                {
                                                    monthLabel(
                                                        month,
                                                    )
                                                }

                                                <button
                                                    type="button"
                                                    disabled={
                                                        isPending
                                                    }
                                                    onClick={() =>
                                                        setMonths(
                                                            (
                                                                current,
                                                            ) =>
                                                                current.filter(
                                                                    (
                                                                        value,
                                                                    ) =>
                                                                        value !==
                                                                        month,
                                                                ),
                                                        )
                                                    }
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                            Kolom bulan menampilkan metode
                            pembayaran terakhir pada bulan
                            tersebut. Jika tidak ada pembayaran,
                            nilainya KOSONG.
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
                                months.length ===
                                0
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
                                : "Export Rekap"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}