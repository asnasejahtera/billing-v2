"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type CurrencyInputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "onChange"
> & {
    value: string | number;
    onValueChange: (value: string) => void;
};

// ============================================================================
// Helpers
// ============================================================================

function normalizeCurrencyValue(value: string | number) {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/^0+(?=\d)/, "");
}

function formatCurrency(value: string | number) {
    const digits = normalizeCurrencyValue(value);
    if (!digits) return "";

    return `Rp ${new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
    }).format(Number(digits))}`;
}

// ============================================================================
// Component
// ============================================================================

export function CurrencyInput({
    value,
    onValueChange,
    className,
    placeholder = "Rp 0",
    disabled,
    ...props
}: CurrencyInputProps) {
    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            value={formatCurrency(value)}
            placeholder={placeholder}
            onChange={(event) => {
                onValueChange(normalizeCurrencyValue(event.target.value));
            }}
            onFocus={(event) => event.currentTarget.select()}
            className={cn(
                "border-input bg-transparent shadow-xs outline-none flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className,
            )}
        />
    );
}