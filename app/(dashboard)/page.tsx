import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardSummary } from "@/features/dashboard/services/dashboard.service";

// ============================================================================
// Main Dashboard
// ============================================================================
export default async function DashboardPage() {
  const data = await getDashboardSummary();
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan pelanggan, billing, PPPoE, OLT, topology, dan WhatsApp periode {data.period}.</p>
      </div>
      {/* Dashboard content */}
      <DashboardOverview data={data} />
    </div>
  );
}
