"use client";

import Link from "next/link";
import {
    ArrowDown,
    ArrowUp,
    FileText,
} from "lucide-react";

import {
    buttonVariants,
} from "@/components/ui/button";

import type { BillingListQuery } from "../schemas/billing-list.schema";
import type {
    BillingDisplayStatus,
} from "../services/billing-list.service";
import {
    formatCurrency,
} from "../utils/format-currency";
import {
    BillingStatusBadge,
} from "./billing-status-badge";
import {
    InvoiceRowActions,
} from "./invoice-row-actions";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    SendSelectedOverdueWhatsAppDialog,
} from "./send-selected-overdue-whatsapp-dialog";

// ============================================================================
// Types
// ============================================================================

type BillingRow = {
    id: number;
    invoiceNumber: string;
    customerId: number;
    customerName: string;
    billingPeriod: string | null;
    invoiceDate: string;
    dueDate: string;
    description: string;
    notes: string | null;
    planName: string | null;
    planPrice: string | null;
    total: string;
    source: "AUTO" | "MANUAL";
    status:
    | "UNPAID"
    | "PARTIAL"
    | "PAID"
    | "VOID";
    displayStatus:
    BillingDisplayStatus;
    isOverdue: boolean;
};

type BillingListProps = {
    data: BillingRow[];
    query: BillingListQuery;
    page: number;
    total: number;
    totalPages: number;
};

// ============================================================================
// Helpers
// ============================================================================

function formatDate(
    value: string,
) {
    const [
        year,
        month,
        day,
    ] = value
        .split("-")
        .map(Number);

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

function formatPeriod(
    value: string | null,
) {
    if (!value) return "-";

    const [
        year,
        month,
    ] = value
        .split("-")
        .map(Number);

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            month: "short",
            year: "numeric",
        },
    ).format(
        new Date(
            year,
            month - 1,
            1,
        ),
    );
}

function createHref(
    query: BillingListQuery,
    changes: Record<
        string,
        string | number | undefined
    >,
) {
    const params =
        new URLSearchParams();

    if (query.q) {
        params.set(
            "q",
            query.q,
        );
    }

    if (query.period) {
        params.set(
            "period",
            query.period,
        );
    }

    if (query.status) {
        params.set(
            "status",
            query.status,
        );
    }

    if (query.source) {
        params.set(
            "source",
            query.source,
        );
    }

    params.set(
        "page",
        String(query.page),
    );

    params.set(
        "pageSize",
        String(query.pageSize),
    );

    params.set(
        "sort",
        query.sort,
    );

    params.set(
        "order",
        query.order,
    );

    for (
        const [
            key,
            value,
        ] of Object.entries(
            changes,
        )
    ) {
        if (
            value === undefined ||
            value === ""
        ) {
            params.delete(key);
        } else {
            params.set(
                key,
                String(value),
            );
        }
    }

    return `/billing?${params.toString()}`;
}

function getSortHref(
    query: BillingListQuery,
    sort: BillingListQuery["sort"],
) {
    const same =
        query.sort === sort;

    return createHref(
        query,
        {
            page: 1,
            sort,
            order:
                same &&
                    query.order === "asc"
                    ? "desc"
                    : "asc",
        },
    );
}

// ============================================================================
// Sort Label
// ============================================================================

function SortLabel({
    query,
    field,
    children,
}: {
    query: BillingListQuery;
    field: BillingListQuery["sort"];
    children: React.ReactNode;
}) {
    const active =
        query.sort === field;

    return (
        <Link
            href={getSortHref(
                query,
                field,
            )}
            className="inline-flex items-center gap-1 hover:underline"
        >
            {children}

            {active &&
                (query.order === "asc" ? (
                    <ArrowUp className="size-3.5" />
                ) : (
                    <ArrowDown className="size-3.5" />
                ))}
        </Link>
    );
}

// ============================================================================
// Component
// ============================================================================

export function BillingList({
    data,
    query,
    page,
    total,
    totalPages,
}: BillingListProps) {

    // ============================================================================
    // Overdue Selection
    // ============================================================================

    const overdueIds =
        useMemo(
            () =>
                data
                    .filter(
                        (invoice) =>
                            invoice.displayStatus ===
                            "OVERDUE",
                    )
                    .map(
                        (invoice) =>
                            invoice.id,
                    ),
            [data],
        );

    const [
        selectedIds,
        setSelectedIds,
    ] = useState<number[]>([]);

    const dataKey =
        data
            .map(
                (invoice) =>
                    invoice.id,
            )
            .join(",");

    useEffect(
        () => {
            setSelectedIds([]);
        },
        [dataKey],
    );

    const allChecked =
        overdueIds.length > 0 &&
        overdueIds.every(
            (id) =>
                selectedIds.includes(
                    id,
                ),
        );

    function toggleInvoice(
        id: number,
        checked: boolean,
    ) {
        setSelectedIds(
            (current) =>
                checked
                    ? [
                        ...new Set([
                            ...current,
                            id,
                        ]),
                    ]
                    : current.filter(
                        (item) =>
                            item !== id,
                    ),
        );
    }

    function toggleAll(
        checked: boolean,
    ) {
        setSelectedIds(
            checked
                ? overdueIds
                : [],
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border text-center">
                <FileText className="mb-3 size-8 text-muted-foreground" />

                <p className="font-medium">
                    Invoice tidak ditemukan
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                    Coba ubah search atau filter billing.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-lg border md:block">
                <div className="overflow-x-auto">
                    {/* ================================================================ */}
                    {/* WhatsApp Bulk Action */}
                    {/* ================================================================ */}

                    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                WhatsApp Tunggakan
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {selectedIds.length} dari{" "}
                                {overdueIds.length} invoice
                                terlambat dipilih
                            </p>
                        </div>

                        <SendSelectedOverdueWhatsAppDialog
                            invoiceIds={
                                selectedIds
                            }
                            onSent={() =>
                                setSelectedIds([])
                            }
                        />
                    </div>
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40 text-left">
                            <tr>
                                <th className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        aria-label="Pilih semua invoice tunggakan"
                                        checked={
                                            allChecked
                                        }
                                        disabled={
                                            overdueIds.length ===
                                            0
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            toggleAll(
                                                event.target
                                                    .checked,
                                            )
                                        }
                                        className="size-4"
                                    />
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    <SortLabel
                                        query={query}
                                        field="invoiceNumber"
                                    >
                                        Invoice
                                    </SortLabel>
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    <SortLabel
                                        query={query}
                                        field="customer"
                                    >
                                        Customer
                                    </SortLabel>
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    Periode
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    <SortLabel
                                        query={query}
                                        field="dueDate"
                                    >
                                        Jatuh Tempo
                                    </SortLabel>
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    <SortLabel
                                        query={query}
                                        field="total"
                                    >
                                        Total
                                    </SortLabel>
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    <SortLabel
                                        query={query}
                                        field="status"
                                    >
                                        Status
                                    </SortLabel>
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.map(
                                (invoice) => (
                                    <tr
                                        key={invoice.id}
                                        className="border-b last:border-0 hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                aria-label={`Pilih ${invoice.invoiceNumber}`}
                                                checked={
                                                    selectedIds.includes(
                                                        invoice.id,
                                                    )
                                                }
                                                disabled={
                                                    invoice.displayStatus !==
                                                    "OVERDUE"
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    toggleInvoice(
                                                        invoice.id,
                                                        event.target
                                                            .checked,
                                                    )
                                                }
                                                className="size-4"
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <p className="font-medium">
                                                {invoice.invoiceNumber}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {invoice.source ===
                                                    "AUTO"
                                                    ? "Bulanan"
                                                    : "Manual"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3">
                                            <p className="font-medium">
                                                {invoice.customerName}
                                            </p>

                                            <p className="max-w-60 truncate text-xs text-muted-foreground">
                                                {invoice.planName ??
                                                    invoice.description}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3">
                                            {formatPeriod(
                                                invoice.billingPeriod,
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            {formatDate(
                                                invoice.dueDate,
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-right font-medium">
                                            {formatCurrency(
                                                invoice.total,
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <BillingStatusBadge
                                                status={
                                                    invoice.displayStatus
                                                }
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <InvoiceRowActions
                                                invoice={{
                                                    id:
                                                        invoice.id,
                                                    invoiceNumber:
                                                        invoice.invoiceNumber,
                                                    description:
                                                        invoice.description,
                                                    notes:
                                                        invoice.notes,
                                                    total:
                                                        invoice.total,
                                                    invoiceDate:
                                                        invoice.invoiceDate,
                                                    dueDate:
                                                        invoice.dueDate,
                                                    status:
                                                        invoice.status,
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
                {data.map(
                    (invoice) => (
                        <div
                            key={invoice.id}
                            className="rounded-lg border p-4"
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    aria-label={`Pilih ${invoice.invoiceNumber}`}
                                    checked={
                                        selectedIds.includes(
                                            invoice.id,
                                        )
                                    }
                                    disabled={
                                        invoice.displayStatus !==
                                        "OVERDUE"
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        toggleInvoice(
                                            invoice.id,
                                            event.target
                                                .checked,
                                        )
                                    }
                                    className="mt-1 size-4"
                                />

                                {/* isi card lama */}
                            </div>

                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {invoice.customerName}
                                    </p>

                                    <p className="truncate text-sm text-muted-foreground">
                                        {invoice.invoiceNumber}
                                    </p>
                                </div>

                                <BillingStatusBadge
                                    status={
                                        invoice.displayStatus
                                    }
                                />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">
                                        Periode
                                    </p>

                                    <p className="font-medium">
                                        {formatPeriod(
                                            invoice.billingPeriod,
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-muted-foreground">
                                        Jatuh Tempo
                                    </p>

                                    <p className="font-medium">
                                        {formatDate(
                                            invoice.dueDate,
                                        )}
                                    </p>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-muted-foreground">
                                        Total
                                    </p>

                                    <p className="text-lg font-semibold">
                                        {formatCurrency(
                                            invoice.total,
                                        )}
                                    </p>
                                </div>

                                <div className="mt-4 border-t pt-4">
                                    <InvoiceRowActions
                                        invoice={{
                                            id:
                                                invoice.id,
                                            invoiceNumber:
                                                invoice.invoiceNumber,
                                            description:
                                                invoice.description,
                                            notes:
                                                invoice.notes,
                                            total:
                                                invoice.total,
                                            invoiceDate:
                                                invoice.invoiceDate,
                                            dueDate:
                                                invoice.dueDate,
                                            status:
                                                invoice.status,
                                        }}
                                    />
                                </div>

                            </div>
                        </div>
                    ),
                )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    {total} invoice · Halaman{" "}
                    {page} dari {totalPages}
                </p>

                <div className="flex gap-2">
                    <Link
                        href={createHref(
                            query,
                            {
                                page:
                                    Math.max(
                                        1,
                                        page - 1,
                                    ),
                            },
                        )}
                        aria-disabled={
                            page <= 1
                        }
                        className={buttonVariants({
                            variant: "outline",
                            className:
                                page <= 1
                                    ? "pointer-events-none opacity-50"
                                    : "",
                        })}
                    >
                        Sebelumnya
                    </Link>

                    <Link
                        href={createHref(
                            query,
                            {
                                page:
                                    Math.min(
                                        totalPages,
                                        page + 1,
                                    ),
                            },
                        )}
                        aria-disabled={
                            page >=
                            totalPages
                        }
                        className={buttonVariants({
                            variant: "outline",
                            className:
                                page >=
                                    totalPages
                                    ? "pointer-events-none opacity-50"
                                    : "",
                        })}
                    >
                        Berikutnya
                    </Link>
                </div>
            </div>
        </div>
    );
}