"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cable,
  ChevronRight,
  CreditCard,
  Gauge,
  Network,
  Package,
  ReceiptText,
  Router,
  Users,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigation = [
  {
    title: "Utama",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: Gauge,
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        title: "Customer",
        href: "/customers",
        icon: Users,
      },
      {
        title: "Paket Internet",
        href: "/plans",
        icon: Package,
      },
      {
        title: "Invoice",
        href: "/invoices",
        icon: ReceiptText,
      },
      {
        title: "Pembayaran",
        href: "/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Network",
    items: [
      {
        title: "Router",
        href: "/routers",
        icon: Router,
      },
      {
        title: "OLT",
        href: "/olts/hsgq",
        icon: Cable,
      },
      {
        title: "Topologi",
        href: "/network-topology",
        icon: Network,
      },
    ],
  },
];

export function AppSidebar(
  props: React.ComponentProps<
    typeof Sidebar
  >,
) {
  const pathname =
    usePathname();

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href="/dashboard" />
              }
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Network className="size-4" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  MikroTik Billing
                </span>

                <span className="truncate text-xs">
                  Admin Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {navigation.map(
          (group) => (
            <Collapsible
              key={
                group.title
              }
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  render={
                    <CollapsibleTrigger />
                  }
                  className="cursor-pointer"
                >
                  {
                    group.title
                  }

                  <ChevronRight className="ml-auto size-4 transition-transform group-data-open/collapsible:rotate-90" />
                </SidebarGroupLabel>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map(
                        (
                          item,
                        ) => {
                          const active =
                            pathname ===
                            item.href ||
                            pathname.startsWith(
                              `${item.href}/`,
                            );

                          return (
                            <SidebarMenuItem
                              key={
                                item.href
                              }
                            >
                              <SidebarMenuButton
                                tooltip={
                                  item.title
                                }
                                isActive={
                                  active
                                }
                                render={
                                  <Link
                                    href={
                                      item.href
                                    }
                                  />
                                }
                              >
                                <item.icon className="size-4" />

                                <span>
                                  {
                                    item.title
                                  }
                                </span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        },
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ),
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}