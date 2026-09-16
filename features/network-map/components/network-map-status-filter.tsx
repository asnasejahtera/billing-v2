"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type {
    NetworkMapNodeStatusFilter,
} from "../types/network-map-runtime.types";

type Props = {
    value: NetworkMapNodeStatusFilter;
    disabled?: boolean;
    onChange: (value: NetworkMapNodeStatusFilter) => void;
};

const OPTIONS: Array<{
    value: NetworkMapNodeStatusFilter;
    label: string;
}> = [
        { value: "ALL", label: "Semua Status" },
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "MAINTENANCE", label: "Maintenance" },
        { value: "DAMAGED", label: "Damaged" },
    ];

/*
 * =========================
 * MAP STATUS FILTER
 * =========================
 */
export function NetworkMapStatusFilter({
    value,
    disabled = false,
    onChange,
}: Props) {
    return (
        <Select
            value={value}
            disabled={disabled}
            onValueChange={(next) => {
                if (!next) return;
                onChange(next as NetworkMapNodeStatusFilter);
            }}
        >
            <SelectTrigger
                className="h-9 w-[150px] shrink-0"
                aria-label="Filter status titik"
            >
                <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
                {OPTIONS.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}