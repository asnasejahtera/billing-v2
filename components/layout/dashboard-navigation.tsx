"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavigation } from "@/config/dashboard-navigation";
import { cn } from "@/lib/utils";

type DashboardNavigationProps = {
    onNavigate?: () => void;
};

export function DashboardNavigation({ onNavigate }: DashboardNavigationProps) {
    const pathname = usePathname();

    return (
        <nav className="space-y-5">
            {dashboardNavigation.map((section) => (
                <div key={section.label}>
                    <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {section.label}
                    </p>
                    <div className="space-y-1">
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                                        active
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    )}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}