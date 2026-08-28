import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Network,
  ReceiptText,
  Router,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wifi,
} from "lucide-react";

export type DashboardNavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type DashboardNavigationSection = {
  label: string;
  items: DashboardNavigationItem[];
};

export const dashboardNavigation: DashboardNavigationSection[] = [
  {
    label: "Utama",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Jaringan",
    items: [
      { title: "Router", href: "/routers", icon: Router },
      // { title: "IP Pool", href: "/network/ip-pools", icon: Network },
      // { title: "PPP Profile", href: "/network/ppp-profiles", icon: Gauge },
      // { title: "PPP Account", href: "/network/ppp-accounts", icon: Wifi },
    ],
  },
  {
    label: "Pelanggan",
    items: [
      { title: "Pelanggan", href: "/customers", icon: UsersRound },
      { title: "Paket Internet", href: "/plans", icon: CircleDollarSign },
    ],
  },
  // {
  //   label: "Billing",
  //   items: [
  //     { title: "Invoice", href: "/billing/invoices", icon: ReceiptText },
  //     { title: "Pembayaran", href: "/billing/payments", icon: CreditCard },
  //   ],
  // },
  // {
  //   label: "Sistem",
  //   items: [
  //     { title: "Monitoring", href: "/monitoring", icon: ChartNoAxesCombined },
  //     { title: "Laporan", href: "/reports", icon: ShieldCheck },
  //     { title: "Pengaturan", href: "/settings", icon: Settings },
  //   ],
  // },
];
