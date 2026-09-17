import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { BillingListQuery } from "../schemas/billing-list.schema";

// ============================================================================
// Props
// ============================================================================

type BillingListToolbarProps = {
    query: BillingListQuery;
};

// ============================================================================
// Component
// ============================================================================

export function BillingListToolbar({
    query,
}: BillingListToolbarProps) {
    return (
        <form
            method="get"
            className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(220px,1fr)_180px_170px_150px_110px_auto]"
        >
            {/* Search */}
            <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    name="q"
                    defaultValue={query.q}
                    placeholder="Cari customer / invoice..."
                    className="pl-9"
                />
            </div>

            {/* Periode */}
            <Input
                type="month"
                name="period"
                defaultValue={
                    query.period ?? ""
                }
            />

            {/* Status */}
            <select
                name="status"
                defaultValue={
                    query.status ?? ""
                }
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <option value="">
                    Semua Status
                </option>
                <option value="UNPAID">
                    Belum Bayar
                </option>
                <option value="PARTIAL">
                    Kurang Bayar
                </option>
                <option value="PAID">
                    Lunas
                </option>
                <option value="OVERDUE">
                    Tunggakan
                </option>
                <option value="VOID">
                    Dibatalkan
                </option>
            </select>

            {/* Source */}
            <select
                name="source"
                defaultValue={
                    query.source ?? ""
                }
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <option value="">
                    Semua Jenis
                </option>
                <option value="AUTO">
                    Bulanan
                </option>
                <option value="MANUAL">
                    Manual
                </option>
            </select>

            {/* Page Size */}
            <select
                name="pageSize"
                defaultValue={String(
                    query.pageSize,
                )}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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

            {/* Preserve Sorting */}
            <input
                type="hidden"
                name="sort"
                value={query.sort}
            />

            <input
                type="hidden"
                name="order"
                value={query.order}
            />

            <input
                type="hidden"
                name="page"
                value="1"
            />

            {/* Submit */}
            <Button type="submit">
                Terapkan
            </Button>
        </form>
    );
}