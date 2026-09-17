import {
  getBillingDashboardStats,
  getCustomerDashboardStats,
  getOltDashboardStats,
  getTopologyDashboardStats,
  getWhatsAppDashboardStats,
  type DashboardPeriod,
} from "@/features/dashboard/repositories/dashboard.repository";
import type { DashboardSummary } from "@/features/dashboard/types/dashboard";

// ============================================================================
// Date helpers — dashboard memakai hari/periode Asia/Jakarta
// ============================================================================
function getJakartaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: "year" | "month" | "day") => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDashboardPeriod(now = new Date()): DashboardPeriod & { label: string } {
  const { year, month, day } = getJakartaParts(now);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    label: `${year}-${pad(month)}`,
    startDate: `${year}-${pad(month)}-01`,
    endDate: `${nextYear}-${pad(nextMonth)}-01`,
    today: `${year}-${pad(month)}-${pad(day)}`,
    dayStart: new Date(Date.UTC(year, month - 1, day, -7, 0, 0)),
    dayEnd: new Date(Date.UTC(year, month - 1, day + 1, -7, 0, 0)),
  };
}

function toNumber(value: unknown) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

// ============================================================================
// Dashboard service
// ============================================================================
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const period = getDashboardPeriod();
  const [customerRow, billingRows, oltRow, topologyRows, whatsappRow] = await Promise.all([
    getCustomerDashboardStats(),
    getBillingDashboardStats(period),
    getOltDashboardStats(),
    getTopologyDashboardStats(),
    getWhatsAppDashboardStats(period),
  ]);
  const totalInvoice = toNumber(billingRows.invoiceRow.totalInvoice);
  const paid = Math.min(totalInvoice, toNumber(billingRows.paymentRow.paidCurrentInvoices));
  const overdueInvoiceTotal = toNumber(billingRows.invoiceRow.overdueInvoiceTotal);
  const overduePaid = toNumber(billingRows.paymentRow.paidOverdueInvoices);
  const registeredOnus = toNumber(customerRow.registeredOnus);
  const onlineOnus = toNumber(customerRow.onlineOnus);
  const pending = toNumber(whatsappRow.pending);
  const processing = toNumber(whatsappRow.processing);
  return {
    period: period.label,
    customers: {
      total: toNumber(customerRow.total),
      active: toNumber(customerRow.active),
      suspended: toNumber(customerRow.suspended),
      inactive: toNumber(customerRow.inactive),
    },
    pppoe: {
      total: toNumber(customerRow.total),
      online: toNumber(customerRow.pppOnline),
      offline: toNumber(customerRow.pppOffline),
    },
    billing: {
      invoiceCount: toNumber(billingRows.invoiceRow.invoiceCount),
      totalInvoice,
      paid,
      outstanding: Math.max(totalInvoice - paid, 0),
      overdue: Math.max(overdueInvoiceTotal - overduePaid, 0),
      overdueCount: toNumber(billingRows.invoiceRow.overdueCount),
      paymentThisMonth: toNumber(billingRows.paymentRow.paymentThisMonth),
    },
    olt: {
      activeOlts: toNumber(oltRow.activeOlts),
      registeredOnus,
      onlineOnus,
      offlineOnus: Math.max(registeredOnus - onlineOnus, 0),
    },
    topology: {
      olt: toNumber(topologyRows.nodeRow.olt),
      odc: toNumber(topologyRows.nodeRow.odc),
      odp: toNumber(topologyRows.nodeRow.odp),
      customers: toNumber(topologyRows.nodeRow.customers),
      poles: toNumber(topologyRows.nodeRow.poles),
      activeLinks: toNumber(topologyRows.linkRow.activeLinks),
    },
    whatsapp: {
      sent: toNumber(whatsappRow.sent),
      pending,
      processing,
      waiting: pending + processing,
      failed: toNumber(whatsappRow.failed),
      cancelled: toNumber(whatsappRow.cancelled),
      total: toNumber(whatsappRow.total),
    },
  };
}
