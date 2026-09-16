"use client";

import {
    CircleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * ============================================
 * WHATSAPP ERROR
 * ============================================
 */
export default function WhatsAppError({
    reset,
}: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-72 items-center justify-center rounded-lg border p-6">
            <div className="max-w-md text-center">
                <CircleAlert className="mx-auto size-10 text-destructive" />

                <h2 className="mt-4 text-lg font-semibold">
                    WhatsApp tidak dapat dimuat
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                    Terjadi kesalahan saat mengambil status koneksi WhatsApp.
                </p>

                <Button
                    type="button"
                    className="mt-4"
                    onClick={reset}
                >
                    Coba Lagi
                </Button>
            </div>
        </div>
    );
}