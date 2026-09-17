"use client";

import {
    useState,
    useTransition,
} from "react";
import {
    FilePlus2,
    Loader2,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import {
    createManualInvoiceAction,
    type CreateManualInvoiceActionResult,
} from "../actions/manual-invoice.action";
import {
    formatCurrency,
} from "../utils/format-currency";

// ============================================================================
// Types
// ============================================================================

type CustomerOption = {
    id: number;
    name: string;
    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
    planName: string;
};

type Props = {
    customers: CustomerOption[];
};

// ============================================================================
// Date Helpers
// ============================================================================

function getLocalDate() {
    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1,
        ).padStart(2, "0");

    const day =
        String(
            now.getDate(),
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ============================================================================
// Component
// ============================================================================

export function CreateManualInvoiceDialog({
    customers,
}: Props) {
    const today =
        getLocalDate();

    const [open, setOpen] =
        useState(false);

    const [
        customerId,
        setCustomerId,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        amount,
        setAmount,
    ] = useState("");

    const [
        invoiceDate,
        setInvoiceDate,
    ] = useState(today);

    const [
        dueDate,
        setDueDate,
    ] = useState(today);

    const [
        notes,
        setNotes,
    ] = useState("");

    const [
        result,
        setResult,
    ] =
        useState<CreateManualInvoiceActionResult | null>(
            null,
        );

    const [
        isPending,
        startTransition,
    ] = useTransition();

    // ==========================================================================
    // Reset
    // ==========================================================================

    function resetForm() {
        setCustomerId("");
        setDescription("");
        setAmount("");
        setInvoiceDate(
            getLocalDate(),
        );
        setDueDate(
            getLocalDate(),
        );
        setNotes("");
        setResult(null);
    }

    // ==========================================================================
    // Submit
    // ==========================================================================

    function handleSubmit() {
        setResult(null);

        startTransition(async () => {
            const response =
                await createManualInvoiceAction({
                    customerId,
                    description,
                    amount,
                    invoiceDate,
                    dueDate,
                    notes,
                });

            setResult(response);

            if (response.success) {
                setDescription("");
                setAmount("");
                setNotes("");
            }
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

                if (!value) {
                    resetForm();
                }
            }}
        >
            <DialogTrigger
                render={
                    <Button variant="outline">
                        <FilePlus2 />
                        Invoice Manual
                    </Button>
                }
            />

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Buat Invoice Manual
                    </DialogTitle>

                    <DialogDescription>
                        Buat tagihan tambahan untuk customer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Customer */}
                    <div className="space-y-2">
                        <Label htmlFor="manual-customer">
                            Customer
                        </Label>

                        <select
                            id="manual-customer"
                            value={customerId}
                            disabled={isPending}
                            onChange={(event) => {
                                setCustomerId(
                                    event.target.value,
                                );
                                setResult(null);
                            }}
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="">
                                Pilih customer
                            </option>

                            {customers.map(
                                (customer) => (
                                    <option
                                        key={customer.id}
                                        value={
                                            customer.id
                                        }
                                    >
                                        {customer.name} —{" "}
                                        {customer.planName}
                                        {customer.status !==
                                            "ACTIVE"
                                            ? ` (${customer.status})`
                                            : ""}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="manual-description">
                            Deskripsi
                        </Label>

                        <Input
                            id="manual-description"
                            value={description}
                            disabled={isPending}
                            placeholder="Contoh: Biaya instalasi"
                            onChange={(event) => {
                                setDescription(
                                    event.target.value,
                                );
                                setResult(null);
                            }}
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="manual-amount">
                            Nominal
                        </Label>

                        <Input
                            id="manual-amount"
                            type="number"
                            min="1"
                            step="1"
                            value={amount}
                            disabled={isPending}
                            placeholder="150000"
                            onChange={(event) => {
                                setAmount(
                                    event.target.value,
                                );
                                setResult(null);
                            }}
                        />

                        {Number(amount) > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {formatCurrency(
                                    amount,
                                )}
                            </p>
                        )}
                    </div>

                    {/* Date */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="manual-invoice-date">
                                Tanggal Invoice
                            </Label>

                            <Input
                                id="manual-invoice-date"
                                type="date"
                                value={invoiceDate}
                                disabled={isPending}
                                onChange={(event) => {
                                    setInvoiceDate(
                                        event.target.value,
                                    );
                                    setResult(null);
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="manual-due-date">
                                Jatuh Tempo
                            </Label>

                            <Input
                                id="manual-due-date"
                                type="date"
                                value={dueDate}
                                disabled={isPending}
                                onChange={(event) => {
                                    setDueDate(
                                        event.target.value,
                                    );
                                    setResult(null);
                                }}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="manual-notes">
                            Catatan
                        </Label>

                        <Textarea
                            id="manual-notes"
                            value={notes}
                            disabled={isPending}
                            placeholder="Opsional"
                            onChange={(event) => {
                                setNotes(
                                    event.target.value,
                                );
                                setResult(null);
                            }}
                        />
                    </div>

                    {/* Result */}
                    {result && (
                        <div
                            className={
                                result.success
                                    ? "rounded-lg border p-3 text-sm"
                                    : "rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                            }
                        >
                            <p>
                                {result.message}
                            </p>

                            {result.success && (
                                <p className="mt-1 font-medium">
                                    {
                                        result.data
                                            .invoiceNumber
                                    }
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
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
                            !customerId ||
                            !description ||
                            !amount ||
                            !invoiceDate ||
                            !dueDate
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
                            : "Simpan Invoice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}