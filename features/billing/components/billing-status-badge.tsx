import { Badge } from "@/components/ui/badge";
import type { BillingDisplayStatus } from "../services/billing-list.service";

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfig: Record<
    BillingDisplayStatus,
    {
        label: string;
        variant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline";
    }
> = {
    UNPAID: {
        label: "Belum Bayar",
        variant: "secondary",
    },
    PARTIAL: {
        label: "Kurang Bayar",
        variant: "default",
    },
    PAID: {
        label: "Lunas",
        variant: "outline",
    },
    VOID: {
        label: "Dibatalkan",
        variant: "outline",
    },
    OVERDUE: {
        label: "Tunggakan",
        variant: "destructive",
    },
};

// ============================================================================
// Component
// ============================================================================

export function BillingStatusBadge({
    status,
}: {
    status: BillingDisplayStatus;
}) {
    const config =
        statusConfig[status];

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
}