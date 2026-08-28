import Link from "next/link";
import { RadioTower } from "lucide-react";

export function AppBrand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <RadioTower className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">MikroTik Billing</p>
        <p className="truncate text-xs text-muted-foreground">RT/RW Net Management</p>
      </div>
    </Link>
  );
}