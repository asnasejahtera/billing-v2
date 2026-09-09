"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NetworkMapSearchResult } from "../types/network-map.types";

type NetworkMapSearchProps = {
    onSearch: (query: string) => NetworkMapSearchResult[];
    onSelect: (nodeId: number) => void;
};

export function NetworkMapSearch({
    onSearch,
    onSelect,
}: NetworkMapSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<NetworkMapSearchResult[]>([]);
    const [open, setOpen] = useState(false);

    /* =========================
     * SEARCH
     * ========================= */
    function handleSearch(value: string) {
        setQuery(value);

        const keyword = value.trim();
        if (!keyword) {
            setResults([]);
            setOpen(false);
            return;
        }

        const nextResults = onSearch(keyword);
        setResults(nextResults);
        setOpen(true);
    }

    /* =========================
     * SELECT RESULT
     * ========================= */
    function handleSelect(result: NetworkMapSearchResult) {
        onSelect(result.id);
        setQuery(result.code);
        setResults([]);
        setOpen(false);
    }

    /* =========================
     * CLEAR SEARCH
     * ========================= */
    function handleClear() {
        setQuery("");
        setResults([]);
        setOpen(false);
    }

    return (
        <div className="relative w-full sm:w-72">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    value={query}
                    onChange={(event) => handleSearch(event.target.value)}
                    onFocus={() => {
                        if (query.trim()) setOpen(true);
                    }}
                    placeholder="Cari titik jaringan..."
                    className="h-9 pl-9 pr-9"
                />

                {query && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                        aria-label="Hapus pencarian"
                    >
                        <X className="size-4" />
                    </Button>
                )}
            </div>

            {open && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover shadow-md">
                    {results.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto p-1">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    type="button"
                                    onClick={() => handleSelect(result)}
                                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                                        <Search className="size-3.5 text-muted-foreground" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">
                                            {result.code}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {result.position.lat.toFixed(6)},{" "}
                                            {result.position.lng.toFixed(6)}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            Titik tidak ditemukan.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}