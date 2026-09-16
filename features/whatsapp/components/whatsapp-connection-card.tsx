"use client";

import Image from "next/image";
import {
    CircleAlert,
    Clock3,
    MessageCircle,
    QrCode,
    Server,
    Smartphone,
    Wifi,
    WifiOff,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import type {
    WhatsAppConnectionSnapshot,
    WhatsAppConnectionStatus,
} from "../types/whatsapp-connection.types";
import {
    LogOut,
    RefreshCw,
} from "lucide-react";

import {
    useTransition,
} from "react";

import { Button } from "@/components/ui/button";

import {
    logoutWhatsAppAction,
    reconnectWhatsAppAction,
} from "../actions/whatsapp-connection.actions";

import {
    WhatsAppTestMessageForm,
} from "./whatsapp-test-message-form";

/**
 * ============================================
 * TYPES
 * ============================================
 */
type WhatsAppConnectionCardProps = {
    initialData: WhatsAppConnectionSnapshot;
};

type ConnectionResponse = {
    success: boolean;
    data?: WhatsAppConnectionSnapshot;
    message?: string;
};

/**
 * ============================================
 * STATUS LABEL
 * ============================================
 */
const statusLabels: Record<
    WhatsAppConnectionStatus,
    string
> = {
    DISCONNECTED: "Terputus",
    STARTING: "Memulai",
    QR_REQUIRED: "Menunggu QR",
    AUTHENTICATED: "Terautentikasi",
    READY: "Terhubung",
    ERROR: "Error",
};

/**
 * ============================================
 * DATE FORMAT
 * ============================================
 */
function formatDate(
    value: string | null,
) {
    if (!value) return "-";

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            dateStyle: "medium",
            timeStyle: "medium",
        },
    ).format(new Date(value));
}

/**
 * ============================================
 * CONNECTION CARD
 * ============================================
 */
export function WhatsAppConnectionCard({
    initialData,
}: WhatsAppConnectionCardProps) {
    const [data, setData] =
        useState(initialData);

    const [pollError, setPollError] =
        useState<string | null>(null);

    const [now, setNow] =
        useState(() => Date.now());

    const [
        isPending,
        startTransition,
    ] = useTransition();

    const [
        actionMessage,
        setActionMessage,
    ] = useState<string | null>(
        null,
    );

    /**
 * ========================================
 * RECONNECT
 * ========================================
 */
    function handleReconnect() {
        setActionMessage(null);

        startTransition(async () => {
            const result =
                await reconnectWhatsAppAction();

            setActionMessage(
                result.message,
            );
        });
    }

    /**
     * ========================================
     * LOGOUT
     * ========================================
     */
    function handleLogout() {
        setActionMessage(null);

        startTransition(async () => {
            const result =
                await logoutWhatsAppAction();

            setActionMessage(
                result.message,
            );
        });
    }

    /**
     * ========================================
     * STATUS POLLING
     * ========================================
     *
     * Poll dilakukan setiap 5 detik.
     * Tidak menyebabkan full page reload.
     */
    useEffect(() => {
        let stopped = false;
        let timer: ReturnType<
            typeof setTimeout
        > | null = null;

        async function poll() {
            try {
                const response =
                    await fetch(
                        "/api/whatsapp/connection",
                        {
                            cache: "no-store",
                        },
                    );

                const result =
                    (await response.json()) as ConnectionResponse;

                if (
                    response.ok &&
                    result.success &&
                    result.data
                ) {
                    if (!stopped) {
                        setData(result.data);
                        setPollError(null);
                    }
                } else if (!stopped) {
                    setPollError(
                        result.message ??
                        "Status WhatsApp gagal diperbarui.",
                    );
                }
            } catch {
                if (!stopped) {
                    setPollError(
                        "Tidak dapat mengambil status WhatsApp.",
                    );
                }
            } finally {
                if (!stopped) {
                    timer = setTimeout(
                        poll,
                        5_000,
                    );
                }
            }
        }

        timer = setTimeout(
            poll,
            5_000,
        );

        return () => {
            stopped = true;
            if (timer) clearTimeout(timer);
        };
    }, []);

    /**
     * ========================================
     * QR COUNTDOWN
     * ========================================
     */
    useEffect(() => {
        const timer = setInterval(
            () => setNow(Date.now()),
            1_000,
        );

        return () =>
            clearInterval(timer);
    }, []);

    const qrRemainingSeconds =
        data.qrExpiresAt
            ? Math.max(
                0,
                Math.ceil(
                    (new Date(
                        data.qrExpiresAt,
                    ).getTime() -
                        now) /
                    1_000,
                ),
            )
            : 0;

    const showQr =
        data.workerOnline &&
        data.status ===
        "QR_REQUIRED" &&
        data.qrAvailable &&
        qrRemainingSeconds > 0 &&
        data.qrVersion !== null;

    return (
        <div className="space-y-4">
            {/* ======================================
          POLLING ERROR
      ====================================== */}
            {pollError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{pollError}</span>
                </div>
            )}

            {/* ======================================
          CONNECTION
      ====================================== */}
            <Card>
                <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="size-5" />
                            Koneksi WhatsApp
                        </CardTitle>

                        <CardDescription>
                            Status koneksi antara aplikasi billing dan WhatsApp worker.
                        </CardDescription>
                    </div>

                    <Badge
                        variant={
                            data.status === "READY"
                                ? "default"
                                : "secondary"
                        }
                    >
                        {statusLabels[data.status]}
                    </Badge>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        {/* ==================================
                CONNECTION DETAIL
            ================================== */}
                        <div className="min-w-0 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {data.workerOnline ? (
                                            <Wifi className="size-4" />
                                        ) : (
                                            <WifiOff className="size-4" />
                                        )}
                                        Worker
                                    </div>

                                    <p className="mt-2 font-medium">
                                        {data.workerOnline
                                            ? "Online"
                                            : "Offline"}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Smartphone className="size-4" />
                                        Nomor WhatsApp
                                    </div>

                                    <p className="mt-2 break-all font-medium">
                                        {data.phoneNumber ??
                                            "Belum terhubung"}
                                    </p>
                                </div>
                            </div>

                            <dl className="divide-y rounded-lg border text-sm">
                                <div className="grid gap-1 p-3 sm:grid-cols-[160px_1fr]">
                                    <dt className="text-muted-foreground">
                                        Nama
                                    </dt>
                                    <dd className="font-medium">
                                        {data.displayName ??
                                            "-"}
                                    </dd>
                                </div>

                                <div className="grid gap-1 p-3 sm:grid-cols-[160px_1fr]">
                                    <dt className="text-muted-foreground">
                                        Session
                                    </dt>
                                    <dd className="break-all font-medium">
                                        {data.sessionName ??
                                            "-"}
                                    </dd>
                                </div>

                                <div className="grid gap-1 p-3 sm:grid-cols-[160px_1fr]">
                                    <dt className="text-muted-foreground">
                                        Worker
                                    </dt>
                                    <dd className="break-all font-medium">
                                        {data.workerInstance ??
                                            "-"}
                                    </dd>
                                </div>

                                <div className="grid gap-1 p-3 sm:grid-cols-[160px_1fr]">
                                    <dt className="text-muted-foreground">
                                        Heartbeat
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDate(
                                            data.lastHeartbeatAt,
                                        )}
                                    </dd>
                                </div>

                                <div className="grid gap-1 p-3 sm:grid-cols-[160px_1fr]">
                                    <dt className="text-muted-foreground">
                                        Terakhir Ready
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDate(
                                            data.lastReadyAt,
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            {/* ======================================
                                    CONNECTION ACTIONS
                                ====================================== */}
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        isPending ||
                                        !data.workerOnline
                                    }
                                    onClick={
                                        handleReconnect
                                    }
                                >
                                    <RefreshCw
                                        className={
                                            isPending
                                                ? "animate-spin"
                                                : undefined
                                        }
                                    />
                                    Reconnect
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={
                                        isPending ||
                                        !data.workerOnline ||
                                        data.status !== "READY"
                                    }
                                    onClick={
                                        handleLogout
                                    }
                                >
                                    <LogOut />
                                    Logout WhatsApp
                                </Button>
                            </div>

                            {actionMessage && (
                                <p className="text-sm text-muted-foreground">
                                    {actionMessage}
                                </p>
                            )}

                            {data.lastError && (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                                    <p className="text-sm font-medium text-destructive">
                                        Error terakhir
                                    </p>
                                    <p className="mt-1 break-words text-sm text-muted-foreground">
                                        {data.lastError}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ==================================
                QR / CONNECTION STATE
            ================================== */}
                        <div className="flex min-h-[340px] items-center justify-center rounded-lg border bg-muted/20 p-4">
                            {showQr ? (
                                <div className="text-center">
                                    <div className="mx-auto w-fit rounded-lg border bg-white p-3">
                                        <Image
                                            key={
                                                data.qrVersion
                                            }
                                            src={`/api/whatsapp/qr?v=${data.qrVersion}`}
                                            alt="QR WhatsApp"
                                            width={280}
                                            height={280}
                                            unoptimized
                                            priority
                                        />
                                    </div>

                                    <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                                        <Clock3 className="size-4" />
                                        QR berlaku sekitar{" "}
                                        {qrRemainingSeconds} detik
                                    </div>

                                    <p className="mt-2 text-xs text-muted-foreground">
                                        WhatsApp → Perangkat tertaut → Tautkan perangkat
                                    </p>
                                </div>
                            ) : data.status ===
                                "READY" &&
                                data.workerOnline ? (
                                <div className="text-center">
                                    <div className="mx-auto flex size-16 items-center justify-center rounded-full border">
                                        <Wifi className="size-7" />
                                    </div>

                                    <p className="mt-4 font-medium">
                                        WhatsApp terhubung
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Client siap digunakan untuk mengirim pesan.
                                    </p>
                                </div>
                            ) : !data.workerOnline ? (
                                <div className="text-center">
                                    <Server className="mx-auto size-10 text-muted-foreground" />

                                    <p className="mt-4 font-medium">
                                        Worker offline
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Jalankan whatsappjs-client terlebih dahulu.
                                    </p>
                                </div>
                            ) : data.status ===
                                "STARTING" ||
                                data.status ===
                                "AUTHENTICATED" ? (
                                <div className="text-center">
                                    <Server className="mx-auto size-10 text-muted-foreground" />

                                    <p className="mt-4 font-medium">
                                        Menyiapkan WhatsApp
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Menunggu client siap digunakan.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <QrCode className="mx-auto size-10 text-muted-foreground" />

                                    <p className="mt-4 font-medium">
                                        Menunggu QR baru
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        QR akan diperbarui otomatis oleh worker.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ======================================
                    TEST MESSAGE
                ====================================== */}
            <WhatsAppTestMessageForm
                enabled={
                    data.workerOnline &&
                    data.status === "READY"
                }
            />
        </div>
    );
}