"use client";

import {
    Link2,
    LocateFixed,
    Loader2,
    MapPin,
    RotateCcw,
    Undo2,
    X,
} from "lucide-react";
import type { ToolMode } from "../types/network-map.types";

type NetworkMapToolbarProps = {
    toolMode: ToolMode;
    waypointCount: number;
    isLocating: boolean;
    onAddNode: () => void;
    onDrawLink: () => void;
    onMyLocation: () => void;
    onResetMap: () => void;
    onUndoWaypoint: () => void;
    onCancel: () => void;
};

/*
 * =========================
 * TOOL BUTTON
 * =========================
 * Tombol icon reusable untuk toolbar map.
 */
function ToolButton({
    label,
    onClick,
    disabled = false,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
            {children}
        </button>
    );
}

/*
 * =========================
 * NETWORK MAP TOOLBAR
 * =========================
 * Hanya menangani presentation.
 * Semua logic map tetap berada di parent.
 */
export function NetworkMapToolbar({
    toolMode,
    waypointCount,
    isLocating,
    onAddNode,
    onDrawLink,
    onMyLocation,
    onResetMap,
    onUndoWaypoint,
    onCancel,
}: NetworkMapToolbarProps) {
    return (
        <div className="flex max-w-full items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur">
            {/* =========================
          NORMAL MODE
          ========================= */}
            {toolMode === "NORMAL" && (
                <>
                    <ToolButton label="Tambah Titik" onClick={onAddNode}>
                        <MapPin className="size-4" />
                    </ToolButton>
                    <ToolButton label="Buat Jalur" onClick={onDrawLink}>
                        <Link2 className="size-4" />
                    </ToolButton>
                    <div className="mx-1 h-6 w-px bg-border" />
                    <ToolButton
                        label={isLocating ? "Mencari Lokasi" : "Lokasi Saya"}
                        onClick={onMyLocation}
                        disabled={isLocating}
                    >
                        {isLocating ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <LocateFixed className="size-4" />
                        )}
                    </ToolButton>
                    <ToolButton label="Reset Map" onClick={onResetMap}>
                        <RotateCcw className="size-4" />
                    </ToolButton>
                </>
            )}

            {/* =========================
          ADD NODE MODE
          ========================= */}
            {toolMode === "ADD_NODE" && (
                <>
                    <span className="px-2 text-sm font-medium">Tambah Titik</span>
                    <ToolButton label="Batal" onClick={onCancel}>
                        <X className="size-4" />
                    </ToolButton>
                </>
            )}

            {/* =========================
          DRAW LINK MODE
          ========================= */}
            {toolMode === "DRAW_LINK" && (
                <>
                    <span className="px-2 text-sm font-medium">
                        Jalur · {waypointCount} WP
                    </span>
                    <ToolButton
                        label="Undo Waypoint"
                        onClick={onUndoWaypoint}
                        disabled={waypointCount === 0}
                    >
                        <Undo2 className="size-4" />
                    </ToolButton>
                    <ToolButton label="Batal" onClick={onCancel}>
                        <X className="size-4" />
                    </ToolButton>
                </>
            )}

            {/* =========================
          ADD WAYPOINT MODE
          ========================= */}
            {toolMode === "ADD_WAYPOINT" && (
                <>
                    <span className="px-2 text-sm font-medium">Tambah Waypoint</span>
                    <ToolButton label="Batal" onClick={onCancel}>
                        <X className="size-4" />
                    </ToolButton>
                </>
            )}
        </div>
    );
}