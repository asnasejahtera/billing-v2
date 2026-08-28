"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppBrand } from "@/components/layout/app-brand";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Buka menu navigasi"
        className="inline-flex size-9 items-center justify-center rounded-md border bg-background hover:bg-muted"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 sm:max-w-[280px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu navigasi</SheetTitle>
          <SheetDescription>Navigasi utama aplikasi MikroTik Billing.</SheetDescription>
        </SheetHeader>
        <div className="flex h-16 items-center px-4">
          <AppBrand />
        </div>
        <Separator />
        <div className="h-[calc(100svh-4rem)] overflow-y-auto px-3 py-4">
          <DashboardNavigation onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}