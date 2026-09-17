import { Badge } from "@/components/ui/badge";

import {
    formatCurrency,
} from "../utils/format-currency";

import {
    CustomerPaymentDialog,
} from "./customer-payment-dialog";

import {
    CustomerPaymentHistoryDialog,
} from "./customer-payment-history-dialog";


// ============================================================================
// Types
// ============================================================================

type PaymentCustomer = {
    id: number;
    name: string;
    address: string | null;
    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
    outstanding: string;
    overdue: string;
};

type Props = {
    data: PaymentCustomer[];
    period?: string;
};
// ============================================================================
// Status
// ============================================================================

function CustomerStatus({
    status,
}: {
    status: PaymentCustomer["status"];
}) {
    if (status === "ACTIVE") {
        return (
            <Badge variant="default">
                Aktif
            </Badge>
        );
    }

    if (status === "SUSPENDED") {
        return (
            <Badge variant="destructive">
                Isolir
            </Badge>
        );
    }

    return (
        <Badge variant="secondary">
            Tidak Aktif
        </Badge>
    );
}

// ============================================================================
// Component
// ============================================================================

export function PaymentCustomerTable({
    data,
    period
}: Props) {
    if (data.length === 0) {
        return (
            <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
                Customer tidak ditemukan.
            </div>
        );
    }

    return (
        <>
            {/* Desktop */}
            <div className="hidden overflow-hidden rounded-lg border md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Customer
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Alamat
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    Kurang Bayar
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    Tunggakan
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {customer.name}
                                    </td>

                                    <td className="max-w-72 truncate px-4 py-3 text-muted-foreground">
                                        {customer.address ?? "-"}
                                    </td>

                                    <td className="px-4 py-3">
                                        <CustomerStatus
                                            status={customer.status}
                                        />
                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold">
                                        {formatCurrency(
                                            customer.outstanding,
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        {Number(
                                            customer.overdue,
                                        ) > 0 ? (
                                            <div>
                                                <p className="font-semibold text-destructive">
                                                    {formatCurrency(
                                                        customer.overdue,
                                                    )}
                                                </p>

                                                <p className="text-xs text-destructive">
                                                    Tunggakan
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <CustomerPaymentHistoryDialog
                                                customer={{
                                                    id:
                                                        customer.id,
                                                    name:
                                                        customer.name,
                                                }}
                                                period={period}
                                            />

                                            <CustomerPaymentDialog
                                                customer={{
                                                    id:
                                                        customer.id,
                                                    name:
                                                        customer.name,
                                                    outstanding:
                                                        customer.outstanding,
                                                }}
                                                period={period}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile */}
            <div className="space-y-3 md:hidden">
                {data.map((customer) => (
                    <div
                        key={customer.id}
                        className="rounded-lg border p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {customer.name}
                                </p>

                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                    {customer.address ?? "-"}
                                </p>
                            </div>

                            <CustomerStatus
                                status={customer.status}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Kurang Bayar
                                </p>

                                <p className="font-semibold">
                                    {formatCurrency(
                                        customer.outstanding,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tunggakan
                                </p>

                                <p
                                    className={
                                        Number(
                                            customer.overdue,
                                        ) > 0
                                            ? "font-semibold text-destructive"
                                            : "font-semibold"
                                    }
                                >
                                    {formatCurrency(
                                        customer.overdue,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                            <CustomerPaymentHistoryDialog
                                customer={{
                                    id:
                                        customer.id,
                                    name:
                                        customer.name,
                                }}
                                period={period}
                            />

                            <CustomerPaymentDialog
                                customer={{
                                    id:
                                        customer.id,
                                    name:
                                        customer.name,
                                    outstanding:
                                        customer.outstanding,
                                }}
                                period={period}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}