import { AppBrand } from "@/components/layout/app-brand";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-background lg:flex">
      <div className="flex h-16 items-center px-4">
        <AppBrand />
      </div>
      <Separator />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <DashboardNavigation />
      </div>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          MikroTik Billing
        </p>
        <p className="text-xs text-muted-foreground">
          Network Management System
        </p>
      </div>
    </aside>
  );
}