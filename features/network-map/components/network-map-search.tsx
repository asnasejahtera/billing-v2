"use client";

import { Search, X } from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResult = {
    id: number;
    code: string;
    position: {
        lat: number;
        lng: number;
    };
};

type NetworkMapSearchProps = {
    onSearch: (query: string) => SearchResult[];
    onSelect: (nodeId: number) => void;
};

export function NetworkMapSearch({
    onSearch,
    onSelect,
}: NetworkMapSearchProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [open, setOpen] = useState(false);

    /*
     * =========================
     * SEARCH
     * =========================
     */
    function handleSearch(value: string) {
        setQuery(value);

        const keyword = value.trim();

        if (!keyword) {
            setResults([]);
            setOpen(false);
            return;
        }

        const found = onSearch(keyword);

        setResults(found);
        setOpen(true);
    }

    /*
     * =========================
     * SELECT RESULT
     * =========================
     */
    function handleSelect(result: SearchResult) {
        onSelect(result.id);
        setQuery(result.code);
        setResults([]);
        setOpen(false);
    }

    /*
     * =========================
     * CLEAR
     * =========================
     */
    function handleClear() {
        setQuery("");
        setResults([]);
        setOpen(false);
    }

    /*
     * =========================
     * CLOSE OUTSIDE
     * =========================
     */
    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            const target = event.target;

            if (
                !(target instanceof Node) ||
                containerRef.current?.contains(target)
            ) {
                return;
            }

            setOpen(false);
        }

        document.addEventListener(
            "pointerdown",
            handlePointerDown,
        );

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
            );
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative ml-2 w-[220px] shrink-0 sm:w-[280px]"
        >
            {/* =========================
                SEARCH INPUT
                ========================= */}
            <div className="relative">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />

                <Input
                    type="search"
                    value={query}
                    onChange={(event) =>
                        handleSearch(
                            event.target.value,
                        )
                    }
                    onFocus={() => {
                        if (
                            query.trim() &&
                            results.length > 0
                        ) {
                            setOpen(true);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" &&
                            results.length > 0
                        ) {
                            event.preventDefault();
                            handleSelect(results[0]);
                        }

                        if (event.key === "Escape") {
                            setOpen(false);
                        }
                    }}
                    placeholder="Cari titik jaringan..."
                    autoComplete="off"
                    className="h-9 pl-9 pr-9"
                />

                {query && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Hapus pencarian"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                    >
                        <X className="size-4" />
                    </Button>
                )}
            </div>

            {/* =========================
                SEARCH RESULT
                ========================= */}
            {open && (
                <div className="absolute left-0 top-full z-[1000] mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    {results.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                            Titik tidak ditemukan.
                        </div>
                    ) : (
                        results.map((result) => (
                            <button
                                key={result.id}
                                type="button"
                                onClick={() =>
                                    handleSelect(result)
                                }
                                className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none"
                            >
                                <Search className="size-4 shrink-0 text-muted-foreground" />

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {result.code}
                                    </p>

                                    <p className="truncate text-xs text-muted-foreground">
                                        {result.position.lat.toFixed(6)},{" "}
                                        {result.position.lng.toFixed(6)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}