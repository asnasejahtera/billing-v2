"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { HsgqOnuRow } from "@/features/olts/types/hsgq-onu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { HsgqOnuDto } from "@/features/olts/types/hsgq-onu";

interface Props {
    data: HsgqOnuRow[];
}

type SortField =
    | "onu"
    | "name"
    | "status"
    | "rx"
    | "distance";

type SortOrder = "asc" | "desc";

function formatPower(value: number | null) {
    return value === null
        ? "-"
        : `${value.toFixed(2)} dBm`;
}

function formatDistance(value: number | null) {
    if (value === null) return "-";
    if (value >= 1000) {
        return `${(value / 1000).toFixed(2)} km`;
    }

    return `${value} m`;
}

function statusVariant(status: string) {
    if (status.toLowerCase() === "online") {
        return "default" as const;
    }

    if (status.toLowerCase() === "offline") {
        return "destructive" as const;
    }

    return "secondary" as const;
}

export function HsgqOnuTable({ data }: Props) {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [pon, setPon] = useState("all");
    const [status, setStatus] = useState("all");
    const [sortField, setSortField] = useState<SortField>("onu");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | "all">(20);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim().toLowerCase());
            setPage(1);
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchInput]);

    const ponOptions = useMemo(
        () =>
            Array.from(
                new Set(data.map((onu) => onu.portId)),
            ).sort((a, b) => a - b),
        [data],
    );

    const filtered = useMemo(() => {
        const rows = data.filter((onu) => {
            if (
                pon !== "all" &&
                onu.portId !== Number(pon)
            ) {
                return false;
            }

            if (
                status !== "all" &&
                onu.status.toLowerCase() !== status
            ) {
                return false;
            }

            if (!search) return true;

            const searchable = [
                onu.id,
                onu.name,
                onu.macAddress,
                onu.vendor,
                onu.onuType,
                onu.deviceType,
                onu.description,
                ...onu.ponMacs.map(
                    (mac) => mac.macAddress,
                ),
            ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(search);
        });

        return [...rows].sort((a, b) => {
            let result = 0;

            switch (sortField) {
                case "onu":
                    result =
                        a.portId === b.portId
                            ? a.onuId - b.onuId
                            : a.portId - b.portId;
                    break;
                case "name":
                    result = a.name.localeCompare(b.name);
                    break;
                case "status":
                    result = a.status.localeCompare(b.status);
                    break;
                case "rx":
                    result =
                        (a.receivePowerDbm ?? -999) -
                        (b.receivePowerDbm ?? -999);
                    break;
                case "distance":
                    result =
                        (a.distanceMeters ?? -1) -
                        (b.distanceMeters ?? -1);
                    break;
            }

            return sortOrder === "asc"
                ? result
                : -result;
        });
    }, [
        data,
        pon,
        search,
        sortField,
        sortOrder,
        status,
    ]);

    const totalPages =
        pageSize === "all"
            ? 1
            : Math.max(
                1,
                Math.ceil(filtered.length / pageSize),
            );

    const currentPage = Math.min(page, totalPages);

    const paginated =
        pageSize === "all"
            ? filtered
            : filtered.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize,
            );

    function resetFilter() {
        setSearchInput("");
        setSearch("");
        setPon("all");
        setStatus("all");
        setPage(1);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                        placeholder="Cari ONU, nama, MAC, vendor..."
                        className="pl-9"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                    <select
                        value={pon}
                        onChange={(event) => {
                            setPon(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="all">
                            Semua PON
                        </option>

                        {ponOptions.map((portId) => (
                            <option
                                key={portId}
                                value={portId}
                            >
                                PON {portId}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="all">
                            Semua Status
                        </option>
                        <option value="online">
                            Online
                        </option>
                        <option value="offline">
                            Offline
                        </option>
                    </select>

                    <select
                        value={sortField}
                        onChange={(event) => {
                            setSortField(
                                event.target.value as SortField,
                            );
                            setPage(1);
                        }}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="onu">
                            Sort: ONU
                        </option>
                        <option value="name">
                            Sort: Nama
                        </option>
                        <option value="status">
                            Sort: Status
                        </option>
                        <option value="rx">
                            Sort: RX Power
                        </option>
                        <option value="distance">
                            Sort: Distance
                        </option>
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(event) => {
                            setSortOrder(
                                event.target.value as SortOrder,
                            );
                            setPage(1);
                        }}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="asc">
                            Naik
                        </option>
                        <option value="desc">
                            Turun
                        </option>
                    </select>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilter}
                >
                    Reset
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <span>
                    Menampilkan{" "}
                    <strong className="text-foreground">
                        {filtered.length}
                    </strong>{" "}
                    ONU
                </span>

                <select
                    value={pageSize}
                    onChange={(event) => {
                        const value = event.target.value;

                        setPageSize(
                            value === "all"
                                ? "all"
                                : Number(value),
                        );

                        setPage(1);
                    }}
                    className="h-8 rounded-md border bg-background px-2"
                >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                    <option value="all">All</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ONU</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead className="hidden md:table-cell">
                                    ONU MAC
                                </TableHead>

                                <TableHead className="hidden lg:table-cell">
                                    PON MAC
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>RX Power</TableHead>
                                <TableHead className="hidden lg:table-cell">
                                    Distance
                                </TableHead>
                                <TableHead className="hidden xl:table-cell">
                                    RTT
                                </TableHead>
                                <TableHead className="hidden xl:table-cell">
                                    ONU Type
                                </TableHead>
                                <TableHead className="hidden xl:table-cell">
                                    Device
                                </TableHead>
                                <TableHead className="hidden 2xl:table-cell">
                                    Vendor
                                </TableHead>
                                <TableHead className="hidden 2xl:table-cell">
                                    Last Down
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={11}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        Tidak ada ONU yang sesuai filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((onu) => (
                                    <TableRow key={onu.id}>
                                        <TableCell className="font-medium">
                                            {onu.id}
                                        </TableCell>

                                        <TableCell>
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">
                                                    {onu.name}
                                                </div>

                                                <div className="truncate text-xs text-muted-foreground md:hidden">
                                                    {onu.macAddress}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="hidden font-mono text-xs md:table-cell">
                                            {onu.macAddress}
                                        </TableCell>

                                        <TableCell className="hidden lg:table-cell">
                                            {onu.ponMacs.length === 0 ? (
                                                <span className="text-muted-foreground">
                                                    -
                                                </span>
                                            ) : (
                                                <div className="space-y-1">
                                                    {onu.ponMacs.map((mac) => (
                                                        <div
                                                            key={`${mac.macAddress}-${mac.vlanId}`}
                                                            className="font-mono text-xs"
                                                        >
                                                            {mac.macAddress}

                                                            <span className="ml-2 text-muted-foreground">
                                                                VLAN {mac.vlanId}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant={statusVariant(
                                                    onu.status,
                                                )}
                                            >
                                                {onu.status}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="whitespace-nowrap">
                                            {formatPower(
                                                onu.receivePowerDbm,
                                            )}
                                        </TableCell>

                                        <TableCell className="hidden whitespace-nowrap lg:table-cell">
                                            {formatDistance(
                                                onu.distanceMeters,
                                            )}
                                        </TableCell>

                                        <TableCell className="hidden xl:table-cell">
                                            {onu.rtt ?? "-"}
                                        </TableCell>

                                        <TableCell className="hidden xl:table-cell">
                                            {onu.onuType}
                                        </TableCell>

                                        <TableCell className="hidden xl:table-cell">
                                            {onu.deviceType}
                                        </TableCell>

                                        <TableCell className="hidden 2xl:table-cell">
                                            {onu.vendor}
                                        </TableCell>

                                        <TableCell className="hidden 2xl:table-cell">
                                            <div className="max-w-48">
                                                <div>
                                                    {onu.lastDownTime ?? "-"}
                                                </div>

                                                <div className="truncate text-xs text-muted-foreground">
                                                    {onu.lastDownReason}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    Page {currentPage} dari{" "}
                    {totalPages}
                </p>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() =>
                            setPage((value) =>
                                Math.max(1, value - 1),
                            )
                        }
                    >
                        <ChevronLeft className="size-4" />
                        Sebelumnya
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                            currentPage >= totalPages
                        }
                        onClick={() =>
                            setPage((value) =>
                                Math.min(
                                    totalPages,
                                    value + 1,
                                ),
                            )
                        }
                    >
                        Berikutnya
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}