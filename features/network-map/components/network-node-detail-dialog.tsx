"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getDistributionTopologyNodeDetailAction } from "../actions/get-distribution-topology-node-detail.action";
import { getCustomerTopologyNodeDetailAction } from "../actions/get-customer-topology-node-detail.action";
import { getOltTopologyNodeDetailAction } from "../actions/get-olt-topology-node-detail.action";
import type { NetworkMapNodeDetailTarget } from "../types/network-map-runtime.types";
import type {
    NetworkMapDistributionNodeDetailDto,
    NetworkMapDistributionPortDetail,
    NetworkMapOltNodeDetailDto,
    NetworkMapCustomerNodeDetailDto
} from "../types/network-map-persistence.types";

type NetworkNodeDetailDialogProps = {
    node: NetworkMapNodeDetailTarget | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1 border-b py-2 last:border-0 sm:grid-cols-[130px_1fr]">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="break-words text-sm font-medium">{value}</p>
        </div>
    );
}

/*
 * =========================
 * PORT DISPLAY HELPERS
 * =========================
 */
function getPortPower(port: NetworkMapDistributionPortDetail) {
    return port.measuredPowerDbm === null
        ? "-"
        : `${port.measuredPowerDbm.toFixed(2)} dBm`;
}

function getPortLoss(port: NetworkMapDistributionPortDetail) {
    const loss = port.actualLossDb ?? port.configuredLossDb;
    return loss === null ? "-" : `${loss.toFixed(2)} dB`;
}

function getPeerLabel(port: NetworkMapDistributionPortDetail) {
    const connection = port.connection;
    if (!connection) return "-";

    if (connection.peerNodeType === "CUSTOMER")
        return connection.peerNodeName;

    return `${connection.peerNodeCode} · ${connection.peerPortName}`;
}

function getFiberLabel(port: NetworkMapDistributionPortDetail) {
    const connection = port.connection;
    if (!connection) return "-";

    const core = connection.coreColor
        ? `Core ${connection.coreColor}`
        : `Core ${connection.coreNumber}`;

    return connection.cableName
        ? `${connection.cableName} · ${core}`
        : core;
}

function PortStatus({ status }: { status: string }) {
    const className = status === "AVAILABLE"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status === "USED"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : status === "DAMAGED"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-muted bg-muted/40 text-muted-foreground";

    return (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>
            {status}
        </span>
    );
}

/*
 * =========================
 * OLT HELPERS
 * =========================
 */
function formatDbm(value: number | null) {
    if (value === null) return "-";
    return `${value > 0 ? "+" : ""}${value.toFixed(2)} dBm`;
}

function getOltPonStatus(
    port: NetworkMapOltNodeDetailDto["ports"][number],
) {
    if (port.topologyPortId === null)
        return "UNMAPPED";

    return port.topologyPortStatus ?? "UNMAPPED";
}

/*
 * =========================
 * NODE DETAIL DIALOG
 * =========================
 */
export function NetworkNodeDetailDialog({
    node,
    open,
    onOpenChange,
}: NetworkNodeDetailDialogProps) {
    const [distribution, setDistribution] =
        useState<NetworkMapDistributionNodeDetailDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [oltDetail, setOltDetail] =
        useState<NetworkMapOltNodeDetailDto | null>(null);
    const [oltLoading, setOltLoading] = useState(false);
    const [oltError, setOltError] = useState<string | null>(null);

    const isDistribution =
        node?.nodeType === "ODC" ||
        node?.nodeType === "ODP";

    const [customerDetail, setCustomerDetail] =
        useState<NetworkMapCustomerNodeDetailDto | null>(null);

    const [customerLoading, setCustomerLoading] =
        useState(false);

    const [customerError, setCustomerError] =
        useState<string | null>(null);
    /*
     * =========================
     * LOAD ODC / ODP DETAIL
     * =========================
     */
    useEffect(() => {
        if (!open || !node || !isDistribution) {
            setDistribution(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        let active = true;

        async function load() {
            setIsLoading(true);
            setError(null);

            const result =
                await getDistributionTopologyNodeDetailAction({
                    nodeId: node!.id,
                });

            if (!active) return;

            if (!result.success) {
                setDistribution(null);
                setError(result.message);
                setIsLoading(false);
                return;
            }

            setDistribution(result.data);
            setIsLoading(false);
        }

        void load();

        return () => {
            active = false;
        };
    }, [open, node, isDistribution]);

    /*
     * =========================
     * LOAD OLT DETAIL
     * =========================
     */
    useEffect(() => {
        if (!open || !node || node.nodeType !== "OLT") {
            setOltDetail(null);
            setOltError(null);
            setOltLoading(false);
            return;
        }

        let active = true;

        async function load() {
            setOltLoading(true);
            setOltError(null);

            const result =
                await getOltTopologyNodeDetailAction({
                    nodeId: node!.id,
                });

            if (!active) return;

            if (!result.success) {
                setOltDetail(null);
                setOltError(result.message);
                setOltLoading(false);
                return;
            }

            setOltDetail(result.data);
            setOltLoading(false);
        }

        void load();

        return () => {
            active = false;
        };
    }, [open, node]);

    /*
 * =========================
 * LOAD CUSTOMER DETAIL
 * =========================
 */
    useEffect(() => {
        if (!open || !node || node.nodeType !== "CUSTOMER") {
            setCustomerDetail(null);
            setCustomerError(null);
            setCustomerLoading(false);
            return;
        }

        let active = true;

        async function load() {
            setCustomerLoading(true);
            setCustomerError(null);

            const result =
                await getCustomerTopologyNodeDetailAction({
                    nodeId: node!.id,
                });

            if (!active) return;

            if (!result.success) {
                setCustomerDetail(null);
                setCustomerError(result.message);
                setCustomerLoading(false);
                return;
            }

            setCustomerDetail(result.data);
            setCustomerLoading(false);
        }

        void load();

        return () => {
            active = false;
        };
    }, [open, node]);

    if (!node) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {node.nodeType} · {node.name}
                    </DialogTitle>
                    <DialogDescription>
                        Informasi titik jaringan {node.code}.
                    </DialogDescription>
                </DialogHeader>

                {/* =========================
                    BASIC INFORMATION
                    ========================= */}
                <div className="space-y-2">
                    <p className="text-sm font-semibold">Informasi</p>

                    <div className="rounded-lg border px-4">
                        <DetailRow
                            label="Jenis"
                            value={node.nodeType}
                        />
                        <DetailRow
                            label="Nama"
                            value={node.name}
                        />
                        <DetailRow
                            label="Kode"
                            value={node.code}
                        />
                        <DetailRow
                            label="Status"
                            value={node.status}
                        />
                        <DetailRow
                            label="Koordinat"
                            value={`${node.position.lat.toFixed(7)}, ${node.position.lng.toFixed(7)}`}
                        />
                        <DetailRow
                            label="Alamat"
                            value={node.address || "-"}
                        />
                        <DetailRow
                            label="Deskripsi"
                            value={node.description || "-"}
                        />
                    </div>
                </div>

                {/* =========================
                    OLT DETAIL
                    ========================= */}
                {node.nodeType === "OLT" && (
                    <OltDetailContent
                        detail={oltDetail}
                        loading={oltLoading}
                        error={oltError}
                    />
                )}

                {node.nodeType === "CUSTOMER" && (
                    <CustomerDetailContent
                        detail={customerDetail}
                        loading={customerLoading}
                        error={customerError}
                    />
                )}

                {/* =========================
                    ODC / ODP LOADING
                    ========================= */}
                {isDistribution && isLoading && (
                    <div className="flex min-h-32 items-center justify-center">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                )}

                {/* =========================
                    ODC / ODP ERROR
                    ========================= */}
                {isDistribution && error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* =========================
                    ODC / ODP DETAIL
                    ========================= */}
                {distribution && !isLoading && (
                    <>
                        {/* =========================
                            SPLITTER
                            ========================= */}
                        <div className="space-y-2">
                            <p className="text-sm font-semibold">
                                Splitter
                            </p>

                            <div className="rounded-lg border px-4">
                                <DetailRow
                                    label="Tipe"
                                    value={distribution.splitterType}
                                />
                                <DetailRow
                                    label="Ratio"
                                    value={distribution.splitterRatio || "-"}
                                />
                                <DetailRow
                                    label="Kapasitas"
                                    value={`${distribution.portCapacity} OUTPUT`}
                                />
                                <DetailRow
                                    label="Input Power"
                                    value={
                                        distribution.inputPowerDbm === null
                                            ? "-"
                                            : `${distribution.inputPowerDbm.toFixed(2)} dBm`
                                    }
                                />
                            </div>
                        </div>

                        {/* =========================
                            PORT SUMMARY
                            ========================= */}
                        <div className="space-y-2">
                            <p className="text-sm font-semibold">
                                Ringkasan Port
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-muted-foreground">
                                        INPUT · Total / Terpakai
                                    </p>
                                    <p className="mt-1 text-xl font-semibold">
                                        {distribution.inputTotal} / {distribution.inputUsed}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-muted-foreground">
                                        OUTPUT · Total / Terpakai
                                    </p>
                                    <p className="mt-1 text-xl font-semibold">
                                        {distribution.outputTotal} / {distribution.outputUsed}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* =========================
                            PORT CONNECTIONS
                            ========================= */}
                        <div className="space-y-5">
                            {/* INPUT */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">
                                        INPUT
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Total / Terpakai:{" "}
                                        {distribution.inputTotal} / {distribution.inputUsed}
                                    </p>
                                </div>

                                <DesktopPortList
                                    ports={distribution.ports.filter(
                                        (port) => port.portType === "INPUT",
                                    )}
                                    directionLabel="Dari"
                                />

                                <MobilePortList
                                    ports={distribution.ports.filter(
                                        (port) => port.portType === "INPUT",
                                    )}
                                    directionLabel="Dari"
                                />
                            </div>

                            {/* OUTPUT */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">
                                        OUTPUT
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Total / Terpakai:{" "}
                                        {distribution.outputTotal} / {distribution.outputUsed}
                                    </p>
                                </div>

                                <DesktopPortList
                                    ports={distribution.ports.filter(
                                        (port) => port.portType === "OUTPUT",
                                    )}
                                    directionLabel="Ke"
                                />

                                <MobilePortList
                                    ports={distribution.ports.filter(
                                        (port) => port.portType === "OUTPUT",
                                    )}
                                    directionLabel="Ke"
                                />
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

/*
 * =========================
 * DESKTOP PORT LIST
 * =========================
 */
function DesktopPortList({
    ports,
    directionLabel,
}: {
    ports: NetworkMapDistributionPortDetail[];
    directionLabel: "Dari" | "Ke";
}) {
    if (ports.length === 0)
        return (
            <p className="py-4 text-sm text-muted-foreground">
                Belum ada port.
            </p>
        );

    return (
        <div className="hidden overflow-hidden rounded-lg border md:block">
            <div className="grid grid-cols-[110px_100px_90px_minmax(180px,1fr)_minmax(180px,1fr)_100px] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Port</span>
                <span>Power</span>
                <span>Redaman</span>
                <span>{directionLabel}</span>
                <span>Fiber / Core</span>
                <span>Status</span>
            </div>

            {ports.map((port) => (
                <div
                    key={port.id}
                    className="grid grid-cols-[110px_100px_90px_minmax(180px,1fr)_minmax(180px,1fr)_100px] items-center gap-3 border-b px-3 py-2 text-sm last:border-0"
                >
                    <span className="font-medium">
                        {port.name}
                    </span>

                    <span className="tabular-nums">
                        {getPortPower(port)}
                    </span>

                    <span className="tabular-nums">
                        {getPortLoss(port)}
                    </span>

                    <span
                        className="min-w-0 truncate"
                        title={getPeerLabel(port)}
                    >
                        {getPeerLabel(port)}
                    </span>

                    <span
                        className="min-w-0 truncate"
                        title={getFiberLabel(port)}
                    >
                        {getFiberLabel(port)}
                    </span>

                    <PortStatus status={port.status} />
                </div>
            ))}
        </div>
    );
}

/*
 * =========================
 * MOBILE PORT LIST
 * =========================
 */
function MobilePortList({
    ports,
    directionLabel,
}: {
    ports: NetworkMapDistributionPortDetail[];
    directionLabel: "Dari" | "Ke";
}) {
    if (ports.length === 0)
        return (
            <p className="py-4 text-sm text-muted-foreground md:hidden">
                Belum ada port.
            </p>
        );

    return (
        <div className="space-y-2 md:hidden">
            {ports.map((port) => (
                <div
                    key={port.id}
                    className="rounded-lg border p-3"
                >
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">
                            {port.name}
                        </p>

                        <PortStatus status={port.status} />
                    </div>

                    <div className="mt-2 grid grid-cols-[70px_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                        <span className="text-muted-foreground">
                            Power
                        </span>

                        <span className="tabular-nums">
                            {getPortPower(port)}
                        </span>

                        <span className="text-muted-foreground">
                            Redaman
                        </span>

                        <span className="tabular-nums">
                            {getPortLoss(port)}
                        </span>

                        <span className="text-muted-foreground">
                            {directionLabel}
                        </span>

                        <span className="min-w-0 break-words">
                            {getPeerLabel(port)}
                        </span>

                        <span className="text-muted-foreground">
                            Fiber
                        </span>

                        <span className="min-w-0 break-words">
                            {getFiberLabel(port)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/*
 * =========================
 * OLT DETAIL CONTENT
 * =========================
 */
function OltDetailContent({
    detail,
    loading,
    error,
}: {
    detail: NetworkMapOltNodeDetailDto | null;
    loading: boolean;
    error: string | null;
}) {
    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="size-5 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
            </div>
        );
    }

    if (!detail) return null;

    return (
        <div className="space-y-5">
            {/* =========================
                OLT INFO
                ========================= */}
            <div className="space-y-2">
                <p className="text-sm font-semibold">
                    OLT
                </p>

                <div className="rounded-lg border px-4">
                    <DetailRow
                        label="Nama OLT"
                        value={detail.oltName}
                    />

                    <DetailRow
                        label="Brand / Model"
                        value={
                            [detail.brand, detail.model]
                                .filter(Boolean)
                                .join(" · ") || "-"
                        }
                    />

                    <DetailRow
                        label="Status Device"
                        value={
                            detail.isActive
                                ? "ACTIVE"
                                : "INACTIVE"
                        }
                    />

                    <DetailRow
                        label="Physical PON"
                        value={`${detail.physicalPonCount}`}
                    />
                </div>
            </div>

            {/* =========================
                PON SUMMARY
                ========================= */}
            <div className="space-y-2">
                <p className="text-sm font-semibold">
                    Ringkasan PON
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <OltSummary
                        label="Physical"
                        value={detail.physicalPonCount}
                    />

                    <OltSummary
                        label="Mapped"
                        value={detail.mappedPonCount}
                    />

                    <OltSummary
                        label="Used"
                        value={detail.usedPonCount}
                    />

                    <OltSummary
                        label="Available"
                        value={detail.availablePonCount}
                    />
                </div>
            </div>

            {/* =========================
                PON PORTS
                ========================= */}
            <div className="space-y-2">
                <div>
                    <h3 className="text-sm font-semibold">
                        PON Port
                    </h3>

                    <p className="text-xs text-muted-foreground">
                        Physical PON dan mapping topology.
                    </p>
                </div>

                {detail.ports.length === 0 ? (
                    <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                        OLT belum mempunyai physical PON port.
                    </div>
                ) : (
                    <>
                        <OltPonDesktop
                            ports={detail.ports}
                        />

                        <OltPonMobile
                            ports={detail.ports}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

/*
 * =========================
 * OLT SUMMARY
 * =========================
 */
function OltSummary({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 text-lg font-semibold">
                {value}
            </p>
        </div>
    );
}

/*
 * =========================
 * OLT PON DESKTOP
 * =========================
 */
function OltPonDesktop({
    ports,
}: {
    ports: NetworkMapOltNodeDetailDto["ports"];
}) {
    return (
        <div className="hidden overflow-hidden rounded-lg border md:block">
            <div className="grid grid-cols-[minmax(100px,1fr)_130px_minmax(120px,1fr)_110px] bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>PORT</span>
                <span>TX POWER</span>
                <span>TOPOLOGY PORT</span>
                <span>STATUS</span>
            </div>

            <div className="divide-y">
                {ports.map((port) => {
                    const status =
                        getOltPonStatus(port);

                    return (
                        <div
                            key={port.id}
                            className="grid grid-cols-[minmax(100px,1fr)_130px_minmax(120px,1fr)_110px] items-center px-3 py-2 text-sm"
                        >
                            <span className="font-medium">
                                {port.name}
                            </span>

                            <span className="tabular-nums">
                                {formatDbm(port.txPowerDbm)}
                            </span>

                            <span>
                                {port.topologyPortName ?? "-"}
                            </span>

                            <OltPonStatus
                                status={status}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/*
 * =========================
 * OLT PON MOBILE
 * =========================
 */
function OltPonMobile({
    ports,
}: {
    ports: NetworkMapOltNodeDetailDto["ports"];
}) {
    return (
        <div className="space-y-2 md:hidden">
            {ports.map((port) => {
                const status =
                    getOltPonStatus(port);

                return (
                    <div
                        key={port.id}
                        className="rounded-lg border p-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-medium">
                                {port.name}
                            </p>

                            <OltPonStatus
                                status={status}
                            />
                        </div>

                        <div className="mt-3 grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-sm">
                            <span className="text-muted-foreground">
                                TX Power
                            </span>

                            <span className="tabular-nums">
                                {formatDbm(port.txPowerDbm)}
                            </span>

                            <span className="text-muted-foreground">
                                Topology
                            </span>

                            <span>
                                {port.topologyPortName ?? "-"}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/*
 * =========================
 * OLT PON STATUS
 * =========================
 */
function OltPonStatus({
    status,
}: {
    status: string;
}) {
    const className =
        status === "USED"
            ? "bg-green-500/10 text-green-700 dark:text-green-400"
            : status === "AVAILABLE"
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                : status === "UNMAPPED"
                    ? "bg-muted text-muted-foreground"
                    : status === "DAMAGED"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400";

    return (
        <span
            className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${className}`}
        >
            {status}
        </span>
    );
}

function CustomerDetailContent({
    detail,
    loading,
    error,
}: {
    detail: NetworkMapCustomerNodeDetailDto | null;
    loading: boolean;
    error: string | null;
}) {
    if (loading) {
        return (
            <div className="flex min-h-32 items-center justify-center">
                <Loader2 className="size-5 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
            </div>
        );
    }

    if (!detail) return null;

    const port = detail.onuPort;
    const connection = port?.connection ?? null;

    return (
        <div className="space-y-5">
            {/* =========================
          CUSTOMER
          ========================= */}
            <div className="space-y-2">
                <p className="text-sm font-semibold">Customer</p>

                <div className="rounded-lg border px-4">
                    <DetailRow label="Nama" value={detail.customerName} />
                    <DetailRow label="Telepon" value={detail.phone ?? "-"} />
                    <DetailRow label="PPPoE" value={detail.pppoeUsername} />
                    <DetailRow label="Status" value={detail.customerStatus} />
                    <DetailRow
                        label="MikroTik"
                        value={detail.isOnline ? "ONLINE" : "OFFLINE"}
                    />
                </div>
            </div>

            {/* =========================
          ONU MONITORING
          ========================= */}
            <div className="space-y-2">
                <p className="text-sm font-semibold">ONU</p>

                <div className="rounded-lg border px-4">
                    <DetailRow
                        label="Status ONU"
                        value={detail.onuStatus ?? "-"}
                    />

                    <DetailRow
                        label="RX Power"
                        value={
                            detail.onuReceivePower
                                ? `${detail.onuReceivePower} dBm`
                                : "-"
                        }
                    />

                    <DetailRow
                        label="Vendor"
                        value={detail.onuVendor ?? "-"}
                    />

                    <DetailRow
                        label="Device"
                        value={detail.onuDeviceType ?? "-"}
                    />

                    <DetailRow
                        label="MAC"
                        value={detail.onuMacAddress ?? "-"}
                    />

                    <DetailRow
                        label="Jarak"
                        value={
                            detail.onuDistanceMeters === null
                                ? "-"
                                : `${detail.onuDistanceMeters} m`
                        }
                    />
                </div>
            </div>

            {/* =========================
          TOPOLOGY CONNECTION
          ========================= */}
            <div className="space-y-2">
                <p className="text-sm font-semibold">
                    Koneksi Fiber
                </p>

                {!port ? (
                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                        Customer belum mempunyai port ONU.
                    </div>
                ) : (
                    <div className="rounded-lg border px-4">
                        <DetailRow
                            label="Port"
                            value={port.name}
                        />

                        <DetailRow
                            label="Status"
                            value={port.status}
                        />

                        <DetailRow
                            label="Power Port"
                            value={
                                port.measuredPowerDbm === null
                                    ? "-"
                                    : `${port.measuredPowerDbm.toFixed(2)} dBm`
                            }
                        />

                        <DetailRow
                            label="Dari"
                            value={
                                connection
                                    ? `${connection.peerNodeCode} · ${connection.peerPortName}`
                                    : "-"
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}