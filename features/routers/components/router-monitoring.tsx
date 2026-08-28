"use client";

import {
    useEffect,
    useState,
} from "react";
import {
    Activity,
    Cpu,
    Database,
    Download,
    HardDrive,
    Loader2,
    MemoryStick,
    RefreshCw,
    Upload,
    WifiOff,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type MonitoringData = {
    resource: {
        uptime: string;
        version: string;
        cpu: string;
        cpuCount: number;
        cpuLoad: number;
        totalMemory: number;
        freeMemory: number;
        usedMemory: number;
        totalStorage: number;
        freeStorage: number;
        usedStorage: number;
        boardName: string;
        architecture: string;
        platform: string;
    };
    interfaces: {
        name: string;
        type: string;
        running: boolean;
    }[];
    interface: {
        name: string;
        type: string;
        running: boolean;
        totalRxBytes: number;
        totalTxBytes: number;
        rxBps: number;
        txBps: number;
        rxPacketsPerSecond: number;
        txPacketsPerSecond: number;
    } | null;
    updatedAt: string;
};

type TrafficSample = {
    time: number;
    rx: number;
    tx: number;
};

type RouterMonitoringProps = {
    routerId: number;
    isActive: boolean;
};

export function RouterMonitoring({
    routerId,
    isActive,
}: RouterMonitoringProps) {
    const [data, setData] =
        useState<MonitoringData | null>(
            null,
        );
    const [
        selectedInterface,
        setSelectedInterface,
    ] = useState("");
    const [history, setHistory] =
        useState<TrafficSample[]>([]);
    const [error, setError] =
        useState<string | null>(null);
    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {
        if (!isActive) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        let timer:
            | ReturnType<typeof setTimeout>
            | undefined;
        let controller:
            | AbortController
            | undefined;

        async function load() {
            controller =
                new AbortController();

            try {
                const params =
                    new URLSearchParams();

                if (selectedInterface) {
                    params.set(
                        "interface",
                        selectedInterface,
                    );
                }

                const query =
                    params.toString();

                const response = await fetch(
                    `/api/routers/${routerId}/monitoring${query ? `?${query}` : ""
                    }`,
                    {
                        signal:
                            controller.signal,
                        cache: "no-store",
                    },
                );

                const result =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message ??
                        "Monitoring gagal",
                    );
                }

                if (cancelled) {
                    return;
                }

                const monitoring =
                    result.data as MonitoringData;

                setData(monitoring);
                setError(null);

                if (
                    !selectedInterface &&
                    monitoring.interface
                ) {
                    setSelectedInterface(
                        monitoring.interface.name,
                    );
                }

                if (monitoring.interface) {
                    setHistory(
                        (current) => [
                            ...current,
                            {
                                time: Date.now(),
                                rx:
                                    monitoring.interface!
                                        .rxBps,
                                tx:
                                    monitoring.interface!
                                        .txBps,
                            },
                        ].slice(-30),
                    );
                }
            } catch (error) {
                if (
                    cancelled ||
                    (error instanceof DOMException &&
                        error.name ===
                        "AbortError")
                ) {
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "Monitoring gagal",
                );
            } finally {
                if (!cancelled) {
                    setIsLoading(false);

                    timer = setTimeout(
                        load,
                        5000,
                    );
                }
            }
        }

        load();

        return () => {
            cancelled = true;

            if (timer) {
                clearTimeout(timer);
            }

            controller?.abort();
        };
    }, [
        routerId,
        isActive,
        selectedInterface,
    ]);

    if (!isActive) {
        return (
            <Card>
                <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
                    <WifiOff className="mb-4 size-8 text-muted-foreground" />
                    <p className="font-medium">
                        Router nonaktif
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Monitoring realtime hanya
                        tersedia untuk router aktif.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading && !data) {
        return (
            <Card>
                <CardContent className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Mengambil data MikroTik...
                </CardContent>
            </Card>
        );
    }

    if (!data && error) {
        return (
            <Card>
                <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
                    <WifiOff className="mb-4 size-8 text-destructive" />
                    <p className="font-medium">
                        Monitoring tidak tersedia
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {error}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const memoryPercentage =
        percentage(
            data.resource.usedMemory,
            data.resource.totalMemory,
        );

    const storagePercentage =
        percentage(
            data.resource.usedStorage,
            data.resource.totalStorage,
        );

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Update monitoring terakhir
                    gagal: {error}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="CPU"
                    value={`${data.resource.cpuLoad}%`}
                    description={`${data.resource.cpu} · ${data.resource.cpuCount} core`}
                    icon={Cpu}
                    progress={
                        data.resource.cpuLoad
                    }
                />

                <MetricCard
                    title="Memory"
                    value={formatBytes(
                        data.resource.usedMemory,
                    )}
                    description={`${formatBytes(
                        data.resource.freeMemory,
                    )} tersedia`}
                    icon={MemoryStick}
                    progress={memoryPercentage}
                />

                <MetricCard
                    title="Storage"
                    value={formatBytes(
                        data.resource.usedStorage,
                    )}
                    description={`${formatBytes(
                        data.resource.freeStorage,
                    )} tersedia`}
                    icon={HardDrive}
                    progress={storagePercentage}
                />

                <MetricCard
                    title="Uptime"
                    value={data.resource.uptime}
                    description={`RouterOS ${data.resource.version}`}
                    icon={Activity}
                />
            </div>

            <Card>
                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>
                            Traffic Realtime
                        </CardTitle>
                        <CardDescription>
                            RX/TX diperbarui setiap
                            5 detik.
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedInterface}
                            onChange={(event) => {
                                setSelectedInterface(
                                    event.target.value,
                                );
                                setHistory([]);
                            }}
                            className="h-9 max-w-52 rounded-md border bg-background px-3 text-sm"
                        >
                            {data.interfaces.map(
                                (item) => (
                                    <option
                                        key={item.name}
                                        value={item.name}
                                    >
                                        {item.name}
                                        {item.running
                                            ? ""
                                            : " (down)"}
                                    </option>
                                ),
                            )}
                        </select>

                        <RefreshCw
                            className={`size-4 text-muted-foreground ${isLoading
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {data.interface ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <TrafficValue
                                    label="Download / RX"
                                    value={formatBps(
                                        data.interface.rxBps,
                                    )}
                                    icon={Download}
                                />

                                <TrafficValue
                                    label="Upload / TX"
                                    value={formatBps(
                                        data.interface.txBps,
                                    )}
                                    icon={Upload}
                                />

                                <TrafficValue
                                    label="Total RX"
                                    value={formatBytes(
                                        data.interface
                                            .totalRxBytes,
                                    )}
                                    icon={Database}
                                />

                                <TrafficValue
                                    label="Total TX"
                                    value={formatBytes(
                                        data.interface
                                            .totalTxBytes,
                                    )}
                                    icon={Database}
                                />
                            </div>

                            <TrafficChart
                                history={history}
                            />

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                                <span>
                                    Interface:{" "}
                                    {data.interface.name}
                                </span>
                                <span>
                                    Type:{" "}
                                    {data.interface.type}
                                </span>
                                <span>
                                    Status:{" "}
                                    {data.interface.running
                                        ? "Running"
                                        : "Down"}
                                </span>
                                <span>
                                    Update:{" "}
                                    {new Date(
                                        data.updatedAt,
                                    ).toLocaleTimeString(
                                        "id-ID",
                                    )}
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Tidak ada interface yang
                            tersedia.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

type MetricCardProps = {
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    progress?: number;
};

function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    progress,
}: MetricCardProps) {
    return (
        <Card>
            <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {title}
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                            {value}
                        </p>
                    </div>

                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-4" />
                    </div>
                </div>

                {progress !== undefined && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        progress,
                                    ),
                                )}%`,
                            }}
                        />
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function TrafficValue({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                {label}
            </div>

            <p className="mt-2 text-xl font-semibold">
                {value}
            </p>
        </div>
    );
}

function TrafficChart({
    history,
}: {
    history: TrafficSample[];
}) {
    const width = 600;
    const height = 180;
    const padding = 12;

    const max = Math.max(
        1,
        ...history.map(
            (item) =>
                Math.max(
                    item.rx,
                    item.tx,
                ),
        ),
    );

    function points(
        key: "rx" | "tx",
    ) {
        if (
            history.length === 0
        ) {
            return "";
        }

        return history
            .map((item, index) => {
                const x =
                    history.length === 1
                        ? width / 2
                        : padding +
                        (index /
                            (history.length -
                                1)) *
                        (width -
                            padding * 2);

                const y =
                    height -
                    padding -
                    (item[key] / max) *
                    (height -
                        padding * 2);

                return `${x},${y}`;
            })
            .join(" ");
    }

    return (
        <div>
            <div className="mb-3 flex gap-5 text-xs">
                <span className="text-primary">
                    — RX
                </span>
                <span className="text-muted-foreground">
                    — TX
                </span>
            </div>

            <div className="overflow-hidden rounded-lg border bg-muted/20">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-52 w-full"
                    role="img"
                    aria-label="Grafik traffic realtime"
                >
                    {[0.25, 0.5, 0.75].map(
                        (value) => (
                            <line
                                key={value}
                                x1="0"
                                x2={width}
                                y1={height * value}
                                y2={height * value}
                                className="text-border"
                                stroke="currentColor"
                                strokeWidth="1"
                            />
                        ),
                    )}

                    <polyline
                        points={points("rx")}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="text-primary"
                    />

                    <polyline
                        points={points("tx")}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="text-muted-foreground"
                    />
                </svg>
            </div>

            <p className="mt-2 text-right text-xs text-muted-foreground">
                Peak: {formatBps(max)}
            </p>
        </div>
    );
}

function percentage(
    used: number,
    total: number,
) {
    if (total <= 0) {
        return 0;
    }

    return (used / total) * 100;
}

function formatBytes(
    value: number,
) {
    if (value <= 0) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB",
    ];

    const index = Math.min(
        Math.floor(
            Math.log(value) /
            Math.log(1024),
        ),
        units.length - 1,
    );

    const amount =
        value /
        1024 ** index;

    return `${amount.toFixed(
        index === 0 ? 0 : 1,
    )} ${units[index]}`;
}

function formatBps(
    value: number,
) {
    if (value < 1000) {
        return `${value.toFixed(0)} bps`;
    }

    if (value < 1_000_000) {
        return `${(
            value / 1000
        ).toFixed(1)} Kbps`;
    }

    if (value < 1_000_000_000) {
        return `${(
            value / 1_000_000
        ).toFixed(1)} Mbps`;
    }

    return `${(
        value / 1_000_000_000
    ).toFixed(2)} Gbps`;
}