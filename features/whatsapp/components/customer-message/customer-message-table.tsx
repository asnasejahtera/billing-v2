"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Badge,
} from "@/components/ui/badge";

import {
    Button,
} from "@/components/ui/button";

import type {
    CustomerMessageRow,
} from "../../types/customer-message.types";
import {
    SendCustomerMessageDialog,
} from "./send-customer-message-dialog";
/**
 * ============================================
 * PROPS
 * ============================================
 */
type Props = {
    customers: CustomerMessageRow[];

    templates: {
        id: number;
        name: string;
        body: string;
    }[];
};
/**
 * ============================================
 * CUSTOMER MESSAGE TABLE
 * ============================================
 */
export function CustomerMessageTable({
    customers,
    templates
}: Props) {
    /**
     * ========================================
     * VALID CUSTOMER IDS
     * ========================================
     */
    const validIds = useMemo(
        () =>
            customers
                .filter(
                    (customer) =>
                        customer.validWhatsApp,
                )
                .map(
                    (customer) =>
                        customer.id,
                ),
        [customers],
    );

    /**
     * ========================================
     * SELECTED
     * ========================================
     */
    const [
        selected,
        setSelected,
    ] =
        useState<Set<number>>(
            new Set(),
        );

    /**
     * ========================================
     * AUTO SELECT ALL
     * ========================================
     *
     * Setiap data customer berubah karena:
     *
     * - filter OLT
     * - filter ODC
     * - filter ODP
     * - search
     * - pagination
     * - All / halaman
     *
     * semua nomor WhatsApp valid otomatis
     * terpilih.
     */
    useEffect(() => {
        setSelected(
            new Set(
                validIds,
            ),
        );
    }, [validIds]);

    /**
     * ========================================
     * SELECT ALL STATUS
     * ========================================
     */
    const allSelected =
        validIds.length > 0 &&
        validIds.every(
            (id) =>
                selected.has(id),
        );

    /**
     * ========================================
     * TOGGLE ROW
     * ========================================
     */
    function toggleRow(
        id: number,
    ) {
        setSelected(
            (current) => {
                const next =
                    new Set(current);

                if (
                    next.has(id)
                ) {
                    next.delete(id);
                } else {
                    next.add(id);
                }

                return next;
            },
        );
    }

    /**
     * ========================================
     * TOGGLE ALL
     * ========================================
     */
    function toggleAll() {
        if (
            allSelected
        ) {
            setSelected(
                new Set(),
            );

            return;
        }

        setSelected(
            new Set(
                validIds,
            ),
        );
    }

    /**
     * ========================================
     * EMPTY
     * ========================================
     */
    if (
        customers.length ===
        0
    ) {
        return (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                Customer tidak ditemukan.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* ======================================
          SELECTION SUMMARY
      ====================================== */}
            <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium">
                        {selected.size} customer dipilih
                    </p>

                    <p className="text-xs text-muted-foreground">
                        Customer dengan nomor WhatsApp valid otomatis dipilih.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <SendCustomerMessageDialog
                        customerIds={[
                            ...selected,
                        ]}
                        templates={
                            templates
                        }
                        onSuccess={() =>
                            setSelected(
                                new Set(),
                            )
                        }
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                            allSelected ||
                            validIds.length === 0
                        }
                        onClick={() =>
                            setSelected(
                                new Set(
                                    validIds,
                                ),
                            )
                        }
                    >
                        Pilih Semua
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                            selected.size === 0
                        }
                        onClick={() =>
                            setSelected(
                                new Set(),
                            )
                        }
                    >
                        Hapus Pilihan
                    </Button>
                </div>
            </div>

            {/* ======================================
          DESKTOP TABLE
      ====================================== */}
            <div className="hidden overflow-hidden rounded-lg border md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr className="border-b">
                                <th className="w-14 p-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={
                                            allSelected
                                        }
                                        disabled={
                                            validIds.length ===
                                            0
                                        }
                                        onChange={
                                            toggleAll
                                        }
                                        aria-label="Pilih semua customer"
                                        className="size-4"
                                    />
                                </th>

                                <th className="p-3 text-left">
                                    Customer
                                </th>

                                <th className="p-3 text-left">
                                    Nomor
                                </th>

                                <th className="p-3 text-left">
                                    WhatsApp
                                </th>

                                <th className="p-3 text-left">
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {customers.map(
                                (customer) => (
                                    <tr
                                        key={
                                            customer.id
                                        }
                                        className="border-b last:border-0"
                                    >
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selected.has(
                                                        customer.id,
                                                    )
                                                }
                                                disabled={
                                                    !customer.validWhatsApp
                                                }
                                                onChange={() =>
                                                    toggleRow(
                                                        customer.id,
                                                    )
                                                }
                                                aria-label={`Pilih ${customer.name}`}
                                                className="size-4"
                                            />
                                        </td>

                                        <td className="p-3 font-medium">
                                            {customer.name}
                                        </td>

                                        <td className="p-3">
                                            {customer.phone ??
                                                "-"}
                                        </td>

                                        <td className="p-3">
                                            {customer.validWhatsApp ? (
                                                <div className="space-y-1">
                                                    <Badge variant="outline">
                                                        Valid
                                                    </Badge>

                                                    <p className="text-xs text-muted-foreground">
                                                        {customer.whatsappPhone}
                                                    </p>
                                                </div>
                                            ) : (
                                                <Badge variant="destructive">
                                                    Tidak Valid
                                                </Badge>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            <Badge variant="secondary">
                                                {customer.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ======================================
          MOBILE
      ====================================== */}
            <div className="space-y-2 md:hidden">
                <label className="flex items-center gap-3 rounded-lg border p-3">
                    <input
                        type="checkbox"
                        checked={
                            allSelected
                        }
                        disabled={
                            validIds.length ===
                            0
                        }
                        onChange={
                            toggleAll
                        }
                        className="size-4"
                    />

                    <span className="text-sm font-medium">
                        Pilih Semua Customer
                    </span>
                </label>

                {customers.map(
                    (customer) => (
                        <label
                            key={
                                customer.id
                            }
                            className={`flex gap-3 rounded-lg border p-3 ${customer.validWhatsApp
                                ? "cursor-pointer"
                                : "opacity-60"
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={
                                    selected.has(
                                        customer.id,
                                    )
                                }
                                disabled={
                                    !customer.validWhatsApp
                                }
                                onChange={() =>
                                    toggleRow(
                                        customer.id,
                                    )
                                }
                                className="mt-1 size-4 shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <p className="font-medium">
                                        {customer.name}
                                    </p>

                                    {customer.validWhatsApp ? (
                                        <Badge variant="outline">
                                            WA Valid
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            WA Invalid
                                        </Badge>
                                    )}
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {customer.phone ??
                                        "Nomor tidak tersedia"}
                                </p>

                                <Badge
                                    variant="secondary"
                                    className="mt-2"
                                >
                                    {customer.status}
                                </Badge>
                            </div>
                        </label>
                    ),
                )}
            </div>
        </div>
    );
}