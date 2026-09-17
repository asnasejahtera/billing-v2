"use client";

import { useState, useTransition } from "react";
import {
    Activity,
    Gauge,
    Loader2,
    RefreshCw,
    Wifi,
    WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { refreshHsgqOnuAction } from "@/features/olts/actions/refresh-hsgq-onu.action";
import { HsgqOnuTable } from "@/features/olts/components/hsgq-onu-table";
import type { HsgqOnuListResult } from "@/features/olts/types/hsgq-onu";
import { UpdateRxPowerButton } from "@/features/olts/components/update-rx-power-button";

interface Props {
    initialData: HsgqOnuListResult;
}

function formatTime(value: Date) {
    return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(value);
}

export function HsgqOnuMonitor({
    initialData,
}: Props) {
    const [data, setData] =
        useState<HsgqOnuListResult>(initialData);

    const [lastUpdated, setLastUpdated] =
        useState<Date>(new Date());

    const [error, setError] =
        useState<string | null>(null);

    const [isPending, startTransition] =
        useTransition();

    function handleRefresh() {
        setError(null);

        startTransition(async () => {
            const response =
                await refreshHsgqOnuAction();

            if (!response.success) {
                setError(response.message);
                return;
            }

            setData(response.result);
            setLastUpdated(
                new Date(response.refreshedAt),
            );
        });
    }

    /* =========================
    * Apply latest optical data
    * ========================= */
    function handleRxUpdated(
        rxRows: {
            portId: number;
            onuId: number;
            receivePowerDbm: number | null;
        }[],
        updatedAt: string,
    ) {
        const rxMap = new Map(
            rxRows.map((onu) => [
                `${onu.portId}:${onu.onuId}`,
                onu.receivePowerDbm,
            ]),
        );

        setData((current) => {
            const rows = current.data.map((onu) => {
                const key =
                    `${onu.portId}:${onu.onuId}`;

                const rx =
                    rxMap.get(key);

                return {
                    ...onu,
                    receivePowerDbm:
                        rx ?? onu.receivePowerDbm,
                };
            });

            const powers = rows
                .map((onu) => onu.receivePowerDbm)
                .filter(
                    (value): value is number =>
                        value !== null,
                );

            return {
                data: rows,
                summary: {
                    ...current.summary,
                    averageRxPowerDbm:
                        powers.length === 0
                            ? null
                            : powers.reduce(
                                (sum, value) =>
                                    sum + value,
                                0,
                            ) / powers.length,
                },
            };
        });

        setLastUpdated(
            new Date(updatedAt),
        );

        setError(null);
    }

    function handleRxError(
        message: string,
    ) {
        setError(message);
    }

    const {
        total,
        online,
        offline,
        averageRxPowerDbm,
    } = data.summary;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                    Terakhir diperbarui:{" "}
                    <span className="font-medium text-foreground">
                        {formatTime(lastUpdated)}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    <UpdateRxPowerButton
                        disabled={isPending}
                        onUpdated={handleRxUpdated}
                        onError={handleRxError}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <RefreshCw className="size-4" />
                        )}

                        {isPending
                            ? "Memperbarui..."
                            : "Refresh Data"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total ONU
                        </CardTitle>

                        <Activity className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {total}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Online
                        </CardTitle>

                        <Wifi className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {online}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Offline
                        </CardTitle>

                        <WifiOff className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {offline}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg RX Power
                        </CardTitle>

                        <Gauge className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {averageRxPowerDbm === null
                                ? "-"
                                : `${averageRxPowerDbm.toFixed(2)} dBm`}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <HsgqOnuTable data={data.data} />
        </div>
    );
}