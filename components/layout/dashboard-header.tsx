import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { AuthenticatedUser } from "@/features/auth/services/auth.service";

type DashboardHeaderProps = {
  user: AuthenticatedUser;
};

export function DashboardHeader({
  user,
}: DashboardHeaderProps) {
  const initial =
    user.name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <div className="lg:hidden">
        <MobileSidebar />
      </div>

      <div className="ml-3 min-w-0 lg:ml-0">
        <p className="truncate text-sm font-medium">
          Billing & Network
        </p>

        <p className="hidden text-xs text-muted-foreground sm:block">
          Kelola pelanggan, jaringan, dan pembayaran.
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <div className="mx-2 hidden text-right sm:block">
          <p className="max-w-40 truncate text-sm font-medium">
            {user.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {user.role}
          </p>
        </div>

        <div className="mr-1 flex size-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {initial}
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}