import {
    BillingList,
} from "@/features/billing/components/billing-list";
import {
    BillingListToolbar,
} from "@/features/billing/components/billing-list-toolbar";
import {
    CreateManualInvoiceDialog,
} from "@/features/billing/components/create-manual-invoice-dialog";
import {
    GenerateInvoiceDialog,
} from "@/features/billing/components/generate-invoice-dialog";
import {
    listBillingService,
} from "@/features/billing/services/billing-list.service";
import {
    listManualInvoiceCustomersService,
} from "@/features/billing/services/manual-invoice.service";
import {
    ExportInvoiceInstallmentDialog,
} from "@/features/billing/components/export-invoice-installment-dialog";

// ============================================================================
// Types
// ============================================================================

type BillingPageProps = {
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

// ============================================================================
// Page
// ============================================================================

export default async function BillingPage({
    searchParams,
}: BillingPageProps) {
    const params =
        await searchParams;

    // --------------------------------------------------------------------------
    // Load Billing + Customer Options
    // --------------------------------------------------------------------------

    const [
        result,
        customers,
    ] = await Promise.all([
        listBillingService({
            q: firstValue(
                params.q,
            ),
            period: firstValue(
                params.period,
            ),
            status: firstValue(
                params.status,
            ),
            source: firstValue(
                params.source,
            ),
            page: firstValue(
                params.page,
            ),
            pageSize: firstValue(
                params.pageSize,
            ),
            sort: firstValue(
                params.sort,
            ),
            order: firstValue(
                params.order,
            ),
        }),

        listManualInvoiceCustomersService(),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Billing
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola invoice, pembayaran,
                        kurang bayar, dan tunggakan customer.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <CreateManualInvoiceDialog
                        customers={
                            customers
                        }
                    />
                    <ExportInvoiceInstallmentDialog />
                    <GenerateInvoiceDialog />
                </div>
            </div>

            {/* Filter */}
            <BillingListToolbar
                query={
                    result.query
                }
            />

            {/* List */}
            <BillingList
                data={
                    result.data
                }
                query={
                    result.query
                }
                page={
                    result.page
                }
                total={
                    result.total
                }
                totalPages={
                    result.totalPages
                }
            />
        </div>
    );
}