import Link from "next/link";

import {
    buttonVariants,
} from "@/components/ui/button";

import {
    PaymentCustomerTable,
} from "@/features/billing/components/payment-customer-table";

import {
    listPaymentCustomersService,
} from "@/features/billing/services/payment-customer.service";

import {
    PaymentSummary,
} from "@/features/billing/components/payment-summary";
// ============================================================================
// Types
// ============================================================================

type PageProps = {
    searchParams: Promise<
        Record<
            string,
            string |
            string[] |
            undefined
        >
    >;
};

// ============================================================================
// Helpers
// ============================================================================

function firstValue(
    value:
        | string
        | string[]
        | undefined,
) {
    return Array.isArray(value)
        ? value[0]
        : value;
}

function createHref(
    query: {
        q: string;
        period?: string;
        status?: string;
        page: number;
        pageSize:
        | number
        | "all";
        sort: string;
        order: string;
        debtStatus?: string;
    },
    page: number,
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

    if (
        query.debtStatus
    ) {
        params.set(
            "debtStatus",
            query.debtStatus,
        );
    }

    params.set(
        "page",
        String(page),
    );

    params.set(
        "pageSize",
        String(
            query.pageSize,
        ),
    );

    params.set(
        "sort",
        query.sort,
    );

    params.set(
        "order",
        query.order,
    );

    return `/billing/payments?${params.toString()}`;
}

// ============================================================================
// Page
// ============================================================================

export default async function PaymentsPage({
    searchParams,
}: PageProps) {
    const params =
        await searchParams;

    // --------------------------------------------------------------------------
    // Data
    // --------------------------------------------------------------------------

    const result =
        await listPaymentCustomersService({
            q:
                firstValue(
                    params.q,
                ),

            period:
                firstValue(
                    params.period,
                ),

            status:
                firstValue(
                    params.status,
                ),
            debtStatus:
                firstValue(
                    params.debtStatus,
                ),
            page:
                firstValue(
                    params.page,
                ),

            pageSize:
                firstValue(
                    params.pageSize,
                ),

            sort:
                firstValue(
                    params.sort,
                ),

            order:
                firstValue(
                    params.order,
                ),
        });

    const isAll =
        result.pageSize ===
        "all";

    return (
        <div className="space-y-6">
            {/* ================================================================ */}
            {/* Header */}
            {/* ================================================================ */}

            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Pembayaran
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Pembayaran dan kurang bayar customer.
                </p>
            </div>

            {/* ================================================================ */}
            {/* Summary */}
            {/* ================================================================ */}

            <PaymentSummary
                summary={
                    result.summary
                }
            />

            {/* ================================================================ */}
            {/* Filter */}
            {/* ================================================================ */}

            <form
                method="get"
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(220px,1fr)_180px_170px_140px_auto]"
            >
                {/* Search */}
                <input
                    name="q"
                    defaultValue={
                        result.query.q
                    }
                    placeholder="Cari nama / alamat..."
                    className="h-9 min-w-0 rounded-md border bg-background px-3 text-sm"
                />

                {/* Month */}
                <input
                    type="month"
                    name="period"
                    defaultValue={
                        result.query
                            .period ??
                        ""
                    }
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                />

                {/* Status */}
                <select
                    name="status"
                    defaultValue={
                        result.query
                            .status ??
                        ""
                    }
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                    <option value="">
                        Semua Status
                    </option>

                    <option value="ACTIVE">
                        Aktif
                    </option>

                    <option value="SUSPENDED">
                        Isolir
                    </option>

                    <option value="INACTIVE">
                        Tidak Aktif
                    </option>
                </select>

                <select
                    name="debtStatus"
                    defaultValue={
                        result.query
                            .debtStatus ??
                        ""
                    }
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                    <option value="">
                        Semua Tagihan
                    </option>

                    <option value="OUTSTANDING">
                        Kurang Bayar
                    </option>

                    <option value="OVERDUE">
                        Tunggakan
                    </option>
                </select>

                {/* Page Size */}
                <select
                    name="pageSize"
                    defaultValue={String(
                        result.pageSize,
                    )}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                    <option value="10">
                        10 / halaman
                    </option>

                    <option value="20">
                        20 / halaman
                    </option>

                    <option value="50">
                        50 / halaman
                    </option>

                    <option value="100">
                        100 / halaman
                    </option>

                    <option value="all">
                        Semua
                    </option>
                </select>

                {/* Reset Page */}
                <input
                    type="hidden"
                    name="page"
                    value="1"
                />

                <input
                    type="hidden"
                    name="sort"
                    value={
                        result.query.sort
                    }
                />

                <input
                    type="hidden"
                    name="order"
                    value={
                        result.query.order
                    }
                />

                <button
                    type="submit"
                    className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                    Terapkan
                </button>
            </form>

            {/* ================================================================ */}
            {/* Table */}
            {/* ================================================================ */}

            <PaymentCustomerTable
                data={
                    result.data
                }
            />

            {/* ================================================================ */}
            {/* Pagination */}
            {/* ================================================================ */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    {result.total} customer
                    {!isAll && (
                        <>
                            {" "}· Halaman{" "}
                            {result.page} dari{" "}
                            {result.totalPages}
                        </>
                    )}

                    {isAll && (
                        <>
                            {" "}· Menampilkan semua
                        </>
                    )}
                </p>

                {!isAll && (
                    <div className="flex gap-2">
                        <Link
                            href={createHref(
                                result.query,
                                Math.max(
                                    1,
                                    result.page - 1,
                                ),
                            )}
                            aria-disabled={
                                result.page <= 1
                            }
                            className={buttonVariants({
                                variant:
                                    "outline",
                                className:
                                    result.page <= 1
                                        ? "pointer-events-none opacity-50"
                                        : "",
                            })}
                        >
                            Sebelumnya
                        </Link>

                        <Link
                            href={createHref(
                                result.query,
                                Math.min(
                                    result.totalPages,
                                    result.page + 1,
                                ),
                            )}
                            aria-disabled={
                                result.page >=
                                result.totalPages
                            }
                            className={buttonVariants({
                                variant:
                                    "outline",
                                className:
                                    result.page >=
                                        result.totalPages
                                        ? "pointer-events-none opacity-50"
                                        : "",
                            })}
                        >
                            Berikutnya
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}