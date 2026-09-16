"use client";

import {
    CalendarClock,
    Send,
} from "lucide-react";

import {
    useEffect,
    useState,
    useTransition,
} from "react";

import {
    Button,
} from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Input,
} from "@/components/ui/input";

import {
    sendWhatsAppTestMessageAction,
} from "../actions/whatsapp-connection.actions";

/**
 * ============================================
 * TYPES
 * ============================================
 */
type Props = {
    enabled: boolean;
};

type MessageStatus =
    | "PENDING"
    | "PROCESSING"
    | "SENT"
    | "FAILED"
    | "CANCELLED";

type StatusResponse = {
    success: boolean;

    data?: {
        id: number;

        status:
        MessageStatus;

        availableAt:
        string;

        error:
        string | null;

        sentAt:
        string | null;
    };
};

/**
 * ============================================
 * LOCAL DATETIME
 * ============================================
 */
function toLocalDateTimeInput(
    date: Date,
) {
    const offset =
        date.getTimezoneOffset() *
        60_000;

    return new Date(
        date.getTime() -
        offset,
    )
        .toISOString()
        .slice(
            0,
            16,
        );
}

/**
 * ============================================
 * TEST MESSAGE FORM
 * ============================================
 */
export function WhatsAppTestMessageForm({
    enabled,
}: Props) {
    const [
        isPending,
        startTransition,
    ] =
        useTransition();

    const [
        phone,
        setPhone,
    ] =
        useState("");

    const [
        body,
        setBody,
    ] =
        useState(
            "Ini adalah pesan test dari aplikasi billing.",
        );

    const [
        scheduleEnabled,
        setScheduleEnabled,
    ] =
        useState(false);

    const [
        scheduledAt,
        setScheduledAt,
    ] =
        useState("");

    const [
        minScheduledAt,
        setMinScheduledAt,
    ] =
        useState("");

    const [
        messageId,
        setMessageId,
    ] =
        useState<
            number | null
        >(null);

    const [
        status,
        setStatus,
    ] =
        useState<
            MessageStatus | null
        >(null);

    const [
        feedback,
        setFeedback,
    ] =
        useState<
            string | null
        >(null);

    /**
     * ========================================
     * MINIMUM SCHEDULE
     * ========================================
     */
    useEffect(() => {
        const minimum =
            new Date(
                Date.now() +
                60_000,
            );

        setMinScheduledAt(
            toLocalDateTimeInput(
                minimum,
            ),
        );
    }, []);

    /**
     * ========================================
     * MESSAGE STATUS POLLING
     * ========================================
     */
    useEffect(() => {
        if (!messageId) {
            return;
        }

        let stopped =
            false;

        let timer:
            | ReturnType<
                typeof setTimeout
            >
            | null =
            null;

        async function poll() {
            try {
                const response =
                    await fetch(
                        `/api/whatsapp/messages/${messageId}`,
                        {
                            cache:
                                "no-store",
                        },
                    );

                const result =
                    (await response.json()) as StatusResponse;

                if (
                    stopped ||
                    !result.success ||
                    !result.data
                ) {
                    return;
                }

                setStatus(
                    result.data
                        .status,
                );

                if (
                    result.data
                        .status ===
                    "SENT"
                ) {
                    setFeedback(
                        "Pesan berhasil dikirim.",
                    );

                    return;
                }

                if (
                    result.data
                        .status ===
                    "FAILED"
                ) {
                    setFeedback(
                        result.data
                            .error ??
                        "Pesan gagal dikirim.",
                    );

                    return;
                }

                if (
                    result.data
                        .status ===
                    "CANCELLED"
                ) {
                    setFeedback(
                        "Pesan dibatalkan.",
                    );

                    return;
                }

                timer =
                    setTimeout(
                        poll,
                        1_500,
                    );
            } catch {
                if (
                    !stopped
                ) {
                    timer =
                        setTimeout(
                            poll,
                            3_000,
                        );
                }
            }
        }

        void poll();

        return () => {
            stopped = true;

            if (timer) {
                clearTimeout(
                    timer,
                );
            }
        };
    }, [
        messageId,
    ]);

    /**
     * ========================================
     * TOGGLE SCHEDULE
     * ========================================
     */
    function toggleSchedule() {
        const next =
            !scheduleEnabled;

        setScheduleEnabled(
            next,
        );

        if (
            next &&
            !scheduledAt
        ) {
            const defaultTime =
                new Date(
                    Date.now() +
                    5 * 60_000,
                );

            setScheduledAt(
                toLocalDateTimeInput(
                    defaultTime,
                ),
            );
        }
    }

    /**
     * ========================================
     * SUBMIT
     * ========================================
     */
    function handleSubmit(
        event:
            React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setFeedback(null);
        setStatus(null);
        setMessageId(null);

        let scheduledAtIso:
            | string
            | null =
            null;

        if (
            scheduleEnabled
        ) {
            if (
                !scheduledAt
            ) {
                setFeedback(
                    "Pilih waktu pengiriman.",
                );

                return;
            }

            const date =
                new Date(
                    scheduledAt,
                );

            if (
                Number.isNaN(
                    date.getTime(),
                )
            ) {
                setFeedback(
                    "Waktu pengiriman tidak valid.",
                );

                return;
            }

            scheduledAtIso =
                date.toISOString();
        }

        startTransition(
            async () => {
                const result =
                    await sendWhatsAppTestMessageAction(
                        {
                            phone,
                            body,

                            scheduledAt:
                                scheduledAtIso,
                        },
                    );

                setFeedback(
                    result.message,
                );

                if (
                    result.success &&
                    result.id
                ) {
                    setMessageId(
                        result.id,
                    );

                    setStatus(
                        "PENDING",
                    );
                }
            },
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Test Kirim Pesan
                </CardTitle>

                <CardDescription>
                    Kirim langsung atau jadwalkan satu pesan WhatsApp.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form
                    className="space-y-4"
                    onSubmit={
                        handleSubmit
                    }
                >
                    {/* ==================================
              PHONE
          ================================== */}
                    <div className="space-y-2">
                        <label
                            htmlFor="whatsapp-test-phone"
                            className="text-sm font-medium"
                        >
                            Nomor WhatsApp
                        </label>

                        <Input
                            id="whatsapp-test-phone"
                            value={
                                phone
                            }
                            onChange={(
                                event,
                            ) =>
                                setPhone(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="081234567890"
                            autoComplete="off"
                            disabled={
                                isPending ||
                                !enabled
                            }
                        />

                        <p className="text-xs text-muted-foreground">
                            Bisa menggunakan 08..., 8..., atau 628....
                        </p>
                    </div>

                    {/* ==================================
              MESSAGE
          ================================== */}
                    <div className="space-y-2">
                        <label
                            htmlFor="whatsapp-test-body"
                            className="text-sm font-medium"
                        >
                            Pesan
                        </label>

                        <textarea
                            id="whatsapp-test-body"
                            value={
                                body
                            }
                            onChange={(
                                event,
                            ) =>
                                setBody(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            disabled={
                                isPending ||
                                !enabled
                            }
                            rows={5}
                            maxLength={
                                4000
                            }
                            className="flex w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {/* ==================================
              SCHEDULE
          ================================== */}
                    <div className="rounded-lg border p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    Jadwalkan Pengiriman
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    Jika tidak aktif, pesan langsung masuk antrean.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant={
                                    scheduleEnabled
                                        ? "default"
                                        : "outline"
                                }
                                disabled={
                                    isPending ||
                                    !enabled
                                }
                                onClick={
                                    toggleSchedule
                                }
                            >
                                <CalendarClock />

                                {scheduleEnabled
                                    ? "Dijadwalkan"
                                    : "Jadwalkan"}
                            </Button>
                        </div>

                        {scheduleEnabled && (
                            <div className="mt-4 space-y-2">
                                <label
                                    htmlFor="whatsapp-scheduled-at"
                                    className="text-sm font-medium"
                                >
                                    Waktu Kirim
                                </label>

                                <Input
                                    id="whatsapp-scheduled-at"
                                    type="datetime-local"
                                    value={
                                        scheduledAt
                                    }
                                    min={
                                        minScheduledAt ||
                                        undefined
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setScheduledAt(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        isPending ||
                                        !enabled
                                    }
                                />

                                <p className="text-xs text-muted-foreground">
                                    Waktu menggunakan timezone perangkat/browser Anda.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ==================================
              STATUS
          ================================== */}
                    {feedback && (
                        <div className="rounded-md border p-3 text-sm">
                            <p>
                                {feedback}
                            </p>

                            {status && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Status:{" "}
                                    {status}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ==================================
              ACTION
          ================================== */}
                    <Button
                        type="submit"
                        disabled={
                            isPending ||
                            !enabled ||
                            !phone.trim() ||
                            !body.trim() ||
                            (
                                scheduleEnabled &&
                                !scheduledAt
                            )
                        }
                    >
                        {scheduleEnabled ? (
                            <CalendarClock />
                        ) : (
                            <Send />
                        )}

                        {isPending
                            ? "Menyimpan..."
                            : scheduleEnabled
                                ? "Jadwalkan Pesan"
                                : "Kirim Pesan"}
                    </Button>

                    {!enabled && (
                        <p className="text-sm text-muted-foreground">
                            Hubungkan WhatsApp terlebih dahulu.
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}