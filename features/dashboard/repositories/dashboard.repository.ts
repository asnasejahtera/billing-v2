import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";
import { invoices } from "@/db/schema/invoices";
import { networkTopologyLinks } from "@/db/schema/network-topology-links";
import { networkTopologyNodes } from "@/db/schema/network-topology-nodes";
import { olts } from "@/db/schema/olts";
import { payments } from "@/db/schema/payments";
import { whatsappMessages } from "@/db/schema/whatsapp-messages";

// ============================================================================
// Repository Input
// ============================================================================
export type DashboardPeriod = {
  startDate: string;
  endDate: string;
  today: string;
  dayStart: Date;
  dayEnd: Date;
};

// ============================================================================
// Customer + PPPoE + cached ONU summary
// ============================================================================
export async function getCustomerDashboardStats() {
  const [row] = await db.select({
    total: sql<number>`count(*)::int`,
    active: sql<number>`count(*) filter (where ${customers.status} = 'ACTIVE')::int`,
    suspended: sql<number>`count(*) filter (where ${customers.status} = 'SUSPENDED')::int`,
    inactive: sql<number>`count(*) filter (where ${customers.status} = 'INACTIVE')::int`,
    pppOnline: sql<number>`count(*) filter (where ${customers.isOnline} = true)::int`,
    pppOffline: sql<number>`count(*) filter (where ${customers.isOnline} = false)::int`,
    registeredOnus: sql<number>`count(distinct (${customers.onuPortId}, ${customers.onuId})) filter (where ${customers.onuPortId} is not null and ${customers.onuId} is not null)::int`,
    onlineOnus: sql<number>`count(distinct (${customers.onuPortId}, ${customers.onuId})) filter (where ${customers.onuPortId} is not null and ${customers.onuId} is not null and lower(coalesce(${customers.onuStatus}, '')) = 'online')::int`,
  }).from(customers);
  return row;
}

// ============================================================================
// Billing summary
// ============================================================================
export async function getBillingDashboardStats(period: DashboardPeriod) {
  const [[invoiceRow], [paymentRow]] = await Promise.all([
    db.select({
      invoiceCount: sql<number>`count(*) filter (where ${invoices.invoiceDate} >= ${period.startDate} and ${invoices.invoiceDate} < ${period.endDate} and ${invoices.status} <> 'VOID')::int`,
      totalInvoice: sql<string>`coalesce(sum(case when ${invoices.invoiceDate} >= ${period.startDate} and ${invoices.invoiceDate} < ${period.endDate} and ${invoices.status} <> 'VOID' then ${invoices.total} else 0 end), 0)`,
      overdueCount: sql<number>`count(*) filter (where ${invoices.dueDate} < ${period.today} and ${invoices.status} in ('UNPAID', 'PARTIAL'))::int`,
      overdueInvoiceTotal: sql<string>`coalesce(sum(case when ${invoices.dueDate} < ${period.today} and ${invoices.status} in ('UNPAID', 'PARTIAL') then ${invoices.total} else 0 end), 0)`,
    }).from(invoices),

    db.select({
      paymentThisMonth: sql<string>`coalesce(sum(case when ${payments.paymentDate} >= ${period.startDate} and ${payments.paymentDate} < ${period.endDate} then ${payments.amount} else 0 end), 0)`,
      paidCurrentInvoices: sql<string>`coalesce(sum(case when ${invoices.invoiceDate} >= ${period.startDate} and ${invoices.invoiceDate} < ${period.endDate} and ${invoices.status} <> 'VOID' then ${payments.amount} else 0 end), 0)`,
      paidOverdueInvoices: sql<string>`coalesce(sum(case when ${invoices.dueDate} < ${period.today} and ${invoices.status} in ('UNPAID', 'PARTIAL') then ${payments.amount} else 0 end), 0)`,
    })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(eq(payments.status, "SUCCESS")),
  ]);

  return { invoiceRow, paymentRow };
}

// ============================================================================
// OLT device summary
// ============================================================================
export async function getOltDashboardStats() {
  const [row] = await db.select({
    activeOlts: sql<number>`count(*) filter (where ${olts.isActive} = true)::int`,
  }).from(olts);
  return row;
}

// ============================================================================
// Network topology summary
// ============================================================================
export async function getTopologyDashboardStats() {
  const [[nodeRow], [linkRow]] = await Promise.all([
    db.select({
      olt: sql<number>`count(*) filter (where ${networkTopologyNodes.nodeType} = 'OLT' and ${networkTopologyNodes.status} = 'ACTIVE')::int`,
      odc: sql<number>`count(*) filter (where ${networkTopologyNodes.nodeType} = 'ODC' and ${networkTopologyNodes.status} = 'ACTIVE')::int`,
      odp: sql<number>`count(*) filter (where ${networkTopologyNodes.nodeType} = 'ODP' and ${networkTopologyNodes.status} = 'ACTIVE')::int`,
      customers: sql<number>`count(*) filter (where ${networkTopologyNodes.nodeType} = 'CUSTOMER' and ${networkTopologyNodes.status} = 'ACTIVE')::int`,
      poles: sql<number>`count(*) filter (where ${networkTopologyNodes.nodeType} = 'POLE' and ${networkTopologyNodes.status} = 'ACTIVE')::int`,
    }).from(networkTopologyNodes),

    db.select({
      activeLinks: sql<number>`count(*) filter (where ${networkTopologyLinks.status} = 'ACTIVE')::int`,
    }).from(networkTopologyLinks),
  ]);

  return { nodeRow, linkRow };
}

// ============================================================================
// WhatsApp queue summary for today (Asia/Jakarta)
// ============================================================================
export async function getWhatsAppDashboardStats(period: DashboardPeriod) {
  const [row] = await db.select({
    sent: sql<number>`count(*) filter (where ${whatsappMessages.status} = 'SENT')::int`,
    pending: sql<number>`count(*) filter (where ${whatsappMessages.status} = 'PENDING')::int`,
    processing: sql<number>`count(*) filter (where ${whatsappMessages.status} = 'PROCESSING')::int`,
    failed: sql<number>`count(*) filter (where ${whatsappMessages.status} = 'FAILED')::int`,
    cancelled: sql<number>`count(*) filter (where ${whatsappMessages.status} = 'CANCELLED')::int`,
    total: sql<number>`count(*)::int`,
  })
    .from(whatsappMessages)
    .where(sql`${whatsappMessages.createdAt} >= ${period.dayStart} and ${whatsappMessages.createdAt} < ${period.dayEnd}`);
  return row;
}
