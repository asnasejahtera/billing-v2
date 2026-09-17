"use client";

import { useTransition } from "react";
import { Gauge, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateHsgqRxPowerAction } from "@/features/olts/actions/update-hsgq-rx-power.action";

/* =========================
 * Types
 * ========================= */
interface RxPowerRow {
    portId: number;
    onuId: number;
    macAddress: string;
    name: string;
    receivePowerDbm: number | null;
    transmitPowerDbm: number | null;
    temperatureC: number | null;
    voltageV: number | null;
    transmitBiasMa: number | null;
}

interface Props {
    disabled?: boolean;
    onUpdated: (
        data: RxPowerRow[],
        updatedAt: string,
    ) => void;
    onError?: (message: string) => void;
}

/* =========================
 * Update RX Power Button
 * ========================= */
export function UpdateRxPowerButton({
    disabled = false,
    onUpdated,
    onError,
}: Props) {
    const [isPending, startTransition] =
        useTransition();

    function handleUpdate() {
        startTransition(async () => {
            const result =
                await updateHsgqRxPowerAction();

            if (!result.success) {
                onError?.(result.message);
                return;
            }

            onUpdated(
                result.data,
                result.updatedAt,
            );
        });
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleUpdate}
            disabled={disabled || isPending}
        >
            {isPending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <Gauge className="size-4" />
            )}

            {isPending
                ? "Update RX..."
                : "Update RX Power"}
        </Button>
    );
}