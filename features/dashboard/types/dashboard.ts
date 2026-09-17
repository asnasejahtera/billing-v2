// ============================================================================
// Dashboard Types
// ============================================================================
export type DashboardSummary = {
  period: string;
  customers: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  pppoe: {
    total: number;
    online: number;
    offline: number;
  };
  billing: {
    invoiceCount: number;
    totalInvoice: number;
    paid: number;
    outstanding: number;
    overdue: number;
    overdueCount: number;
    paymentThisMonth: number;
  };
  olt: {
    activeOlts: number;
    registeredOnus: number;
    onlineOnus: number;
    offlineOnus: number;
  };
  topology: {
    olt: number;
    odc: number;
    odp: number;
    customers: number;
    poles: number;
    activeLinks: number;
  };
  whatsapp: {
    sent: number;
    pending: number;
    processing: number;
    waiting: number;
    failed: number;
    cancelled: number;
    total: number;
  };
};
