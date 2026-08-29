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