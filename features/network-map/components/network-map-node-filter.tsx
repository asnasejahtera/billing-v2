"use client";

import { Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type {
    NetworkMapNodeTypeFilter,
} from "../types/network-map-runtime.types";

type Props = {
    value: NetworkMapNodeTypeFilter;
    disabled?: boolean;
    onChange: (value: NetworkMapNodeTypeFilter) => void;
};

const OPTIONS: Array<{
    value: NetworkMapNodeTypeFilter;
    label: string;
}> = [
        { value: "ALL", label: "Semua Titik" },
        { value: "OLT", label: "OLT" },
        { value: "ODC", label: "ODC" },
        { value: "ODP", label: "ODP" },
        { value: "CUSTOMER", label: "Customer" },
        { value: "ROUTER", label: "Router" },
        { value: "POLE", label: "Tiang" },
    ];

export function NetworkMapNodeFilter({
    value,
    disabled = false,
    onChange,
}: Props) {
    return (
        <div className="ml-2 flex shrink-0 items-center gap-2">
            <Filter className="hidden size-4 text-muted-foreground sm:block" />

            <Select
                value={value}
                disabled={disabled}
                onValueChange={(next) => {
                    if (!next) return;

                    onChange(
                        next as NetworkMapNodeTypeFilter,
                    );
                }}
            >
                <SelectTrigger
                    className="h-9 w-[145px] sm:w-[160px]"
                    aria-label="Filter jenis titik"
                >
                    <SelectValue placeholder="Filter titik" />
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
        </div>
    );
}