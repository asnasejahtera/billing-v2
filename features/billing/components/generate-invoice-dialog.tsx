"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    generateInvoicesAction,
    type GenerateInvoicesActionResult,
} from "../actions/generate-invoices.action";

// ============================================================================
// Helpers
// ============================================================================

function getCurrentBillingPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function formatPeriod(period: string) {
    const [year, month] = period.split("-").map(Number);
    if (!year || !month) return period;

    return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, 1));
}

function formatDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) return date;

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, day));
}

// ============================================================================
// Component
// ============================================================================

export function GenerateInvoiceDialog() {
    const [open, setOpen] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState(
        getCurrentBillingPeriod(),
    );
    const [invoiceDay, setInvoiceDay] = useState("1");
    const [dueDay, setDueDay] = useState("20");
    const [result, setResult] =
        useState<GenerateInvoicesActionResult | null>(null);
    const [isPending, startTransition] = useTransition();

    const periodLabel = useMemo(
        () => formatPeriod(billingPeriod),
        [billingPeriod],
    );

    // ==========================================================================
    // Reset
    // ==========================================================================

    function resetResult() {
        setResult(null);
    }

    // ==========================================================================
    // Submit
    // ==========================================================================

    function handleGenerate() {
        resetResult();

        startTransition(async () => {
            const response =
                await generateInvoicesAction({
                    billingPeriod,
                    invoiceDay,
                    dueDay,
                });

            setResult(response);
        });
    }

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                if (!value) resetResult();
            }}
        >
            <DialogTrigger
                render={
                    <Button>
                        <CalendarDays />
                        Generate Invoice
                    </Button>
                }
            />

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Generate Invoice Bulanan
                    </DialogTitle>

                    <DialogDescription>
                        Buat invoice dari paket internet seluruh customer aktif.
                        Customer yang sudah mempunyai invoice pada periode yang sama
                        akan dilewati.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Periode Billing */}
                    <div className="space-y-2">
                        <Label htmlFor="billing-period">
                            Periode Billing
                        </Label>

                        <Input
                            id="billing-period"
                            type="month"
                            value={billingPeriod}
                            disabled={isPending}
                            onChange={(event) => {
                                setBillingPeriod(event.target.value);
                                resetResult();
                            }}
                        />

                        {billingPeriod && (
                            <p className="text-sm text-muted-foreground">
                                Invoice akan dibuat untuk periode {periodLabel}.
                            </p>
                        )}
                    </div>

                    {/* Tanggal */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="invoice-day">
                                Tanggal Invoice
                            </Label>

                            <Input
                                id="invoice-day"
                                type="number"
                                min={1}
                                max={31}
                                value={invoiceDay}
                                disabled={isPending}
                                onChange={(event) => {
                                    setInvoiceDay(event.target.value);
                                    resetResult();
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due-day">
                                Jatuh Tempo
                            </Label>

                            <Input
                                id="due-day"
                                type="number"
                                min={1}
                                max={31}
                                value={dueDay}
                                disabled={isPending}
                                onChange={(event) => {
                                    setDueDay(event.target.value);
                                    resetResult();
                                }}
                            />
                        </div>
                    </div>

                    {/* Informasi */}
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                        <p className="font-medium">
                            Konfigurasi
                        </p>

                        <div className="mt-2 space-y-1 text-muted-foreground">
                            <p>
                                Periode: {periodLabel}
                            </p>

                            <p>
                                Tanggal invoice: {invoiceDay || "-"}
                            </p>

                            <p>
                                Jatuh tempo: {dueDay || "-"}
                            </p>
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <div
                            className={
                                result.success
                                    ? "rounded-lg border p-4"
                                    : "rounded-lg border border-destructive/40 bg-destructive/5 p-4"
                            }
                        >
                            <p
                                className={
                                    result.success
                                        ? "font-medium"
                                        : "font-medium text-destructive"
                                }
                            >
                                {result.message}
                            </p>

                            {result.success && (
                                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                                    <div className="rounded-md border p-3">
                                        <p className="text-lg font-semibold">
                                            {result.data.totalActive}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Customer
                                        </p>
                                    </div>

                                    <div className="rounded-md border p-3">
                                        <p className="text-lg font-semibold">
                                            {result.data.created}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Dibuat
                                        </p>
                                    </div>

                                    <div className="rounded-md border p-3">
                                        <p className="text-lg font-semibold">
                                            {result.data.skipped}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Dilewati
                                        </p>
                                    </div>
                                </div>
                            )}

                            {result.success && (
                                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                    <p>
                                        Tanggal invoice:{" "}
                                        {formatDate(result.data.invoiceDate)}
                                    </p>

                                    <p>
                                        Jatuh tempo:{" "}
                                        {formatDate(result.data.dueDate)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setOpen(false)}
                    >
                        Tutup
                    </Button>

                    <Button
                        type="button"
                        disabled={
                            isPending ||
                            !billingPeriod ||
                            !invoiceDay ||
                            !dueDay
                        }
                        onClick={handleGenerate}
                    >
                        {isPending && (
                            <Loader2 className="animate-spin" />
                        )}

                        {isPending
                            ? "Generate..."
                            : "Generate Invoice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}