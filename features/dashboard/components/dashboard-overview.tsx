import type { LucideIcon } from "lucide-react";
import {
    Cable,
    CircleDollarSign,
    MessageCircle,
    Network,
    ReceiptText,
    Users,
    Wifi,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/features/dashboard/types/dashboard";

// ============================================================================
// Formatting
// ============================================================================
const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});
function currency(value: number) {
    return currencyFormatter.format(value);
}
function number(value: number) {
    return new Intl.NumberFormat("id-ID").format(value);
}

// ============================================================================
// Shared dashboard primitives
// ============================================================================
function SummaryCard({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: LucideIcon }) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0 space-y-1">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-2.5">
                    <Icon className="size-5" aria-hidden="true" />
                </div>
            </CardContent>
        </Card>
    );
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium tabular-nums">{value}</span>
        </div>
    );
}

// ============================================================================
// Dashboard overview
// ============================================================================
export function DashboardOverview({ data }: { data: DashboardSummary }) {
    return (
        <div className="space-y-5">
            {/* Primary operational summary */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard title="Pelanggan" value={number(data.customers.total)} description={`${number(data.customers.active)} aktif`} icon={Users} />
                <SummaryCard title="PPPoE Online" value={number(data.pppoe.online)} description={`${number(data.pppoe.offline)} offline`} icon={Wifi} />
                <SummaryCard title="Total Tagihan" value={currency(data.billing.totalInvoice)} description={`${number(data.billing.invoiceCount)} invoice bulan ini`} icon={ReceiptText} />
                <SummaryCard title="Tunggakan" value={currency(data.billing.overdue)} description={`${number(data.billing.overdueCount)} invoice perlu perhatian`} icon={CircleDollarSign} />
                <SummaryCard title="Pembayaran" value={currency(data.billing.paymentThisMonth)} description="Pembayaran masuk bulan ini" icon={CircleDollarSign} />
                <SummaryCard title="ONU Online" value={number(data.olt.onlineOnus)} description={`${number(data.olt.offlineOnus)} offline · ${number(data.olt.registeredOnus)} terdaftar`} icon={Cable} />
                <SummaryCard title="WhatsApp Hari Ini" value={number(data.whatsapp.sent)} description={`${number(data.whatsapp.waiting)} menunggu · ${number(data.whatsapp.failed)} gagal`} icon={MessageCircle} />
            </div>

            {/* Detailed summaries */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Billing Bulan Ini</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatRow label="Total Tagihan" value={currency(data.billing.totalInvoice)} />
                        <StatRow label="Sudah Dibayar" value={currency(data.billing.paid)} />
                        <StatRow label="Kurang Bayar" value={currency(data.billing.outstanding)} />
                        <StatRow label="Tunggakan" value={currency(data.billing.overdue)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Pelanggan & PPPoE</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatRow label="Pelanggan Aktif" value={number(data.customers.active)} />
                        <StatRow label="Suspended" value={number(data.customers.suspended)} />
                        <StatRow label="Inactive" value={number(data.customers.inactive)} />
                        <StatRow label="PPPoE Online" value={number(data.pppoe.online)} />
                        <StatRow label="PPPoE Offline" value={number(data.pppoe.offline)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base"><Network className="size-4" aria-hidden="true" />OLT & Topology</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatRow label="OLT Aktif" value={number(data.olt.activeOlts)} />
                        <StatRow label="ONU Terdaftar" value={number(data.olt.registeredOnus)} />
                        <StatRow label="ONU Online" value={number(data.olt.onlineOnus)} />
                        <StatRow label="ONU Offline" value={number(data.olt.offlineOnus)} />
                        <StatRow label="ODC" value={number(data.topology.odc)} />
                        <StatRow label="ODP" value={number(data.topology.odp)} />
                        <StatRow label="Customer di Map" value={number(data.topology.customers)} />
                        <StatRow label="Fiber Link Aktif" value={number(data.topology.activeLinks)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">WhatsApp Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatRow label="Terkirim" value={number(data.whatsapp.sent)} />
                        <StatRow label="Menunggu" value={number(data.whatsapp.waiting)} />
                        <StatRow label="Sedang Diproses" value={number(data.whatsapp.processing)} />
                        <StatRow label="Gagal" value={number(data.whatsapp.failed)} />
                        <StatRow label="Dibatalkan" value={number(data.whatsapp.cancelled)} />
                        <StatRow label="Total Hari Ini" value={number(data.whatsapp.total)} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
