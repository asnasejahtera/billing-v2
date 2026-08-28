import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCurrentUser } from "@/features/auth/services/current-user.service";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-svh bg-muted/20">
      <div className="flex min-h-svh">
        <AppSidebar />

        <div className="min-w-0 flex-1">
          <DashboardHeader user={user} />

          <main className="p-4 sm:p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}