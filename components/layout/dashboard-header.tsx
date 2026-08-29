"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/features/auth/components/logout-button";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  routers: "Router",
  plans: "Paket Internet",
  customers: "Customer",
  invoices: "Invoice",
  payments: "Pembayaran",
  network: "Network",
  topology: "Topologi",
};

export function DashboardHeader() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />

      <Separator
        orientation="vertical"
        className="mr-2 h-4"
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink
              render={
                <Link href="/dashboard" />
              }
            >
              Billing MikroTik
            </BreadcrumbLink>
          </BreadcrumbItem>

          {segments.length > 0 && (
            <BreadcrumbSeparator className="hidden sm:block" />
          )}

          {segments.map(
            (
              segment,
              index,
            ) => {
              const last =
                index ===
                segments.length - 1;

              const href =
                "/" +
                segments
                  .slice(
                    0,
                    index + 1,
                  )
                  .join("/");

              const numeric =
                /^\d+$/.test(
                  segment,
                );

              const label =
                numeric
                  ? `#${segment}`
                  : routeLabels[
                  segment
                  ] ??
                  formatLabel(
                    segment,
                  );

              return (
                <BreadcrumbItem
                  key={href}
                  className={
                    !last
                      ? "hidden md:flex"
                      : undefined
                  }
                >
                  {last ? (
                    <BreadcrumbPage>
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink
                        render={
                          <Link
                            href={
                              href
                            }
                          />
                        }
                      >
                        {
                          label
                        }
                      </BreadcrumbLink>

                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              );
            },
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}

function formatLabel(
  value: string,
) {
  return value
    .replace(
      /-/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}