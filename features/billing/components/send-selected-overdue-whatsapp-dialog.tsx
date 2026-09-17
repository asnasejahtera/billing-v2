"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Loader2,
    MessageCircle,
} from "lucide-react";

import {
    getOverdueWhatsAppProgressAction,
    sendOverdueInvoicesWhatsAppAction,
} from "../actions/invoice-whatsapp.action";

import {
    invoiceWhatsAppTemplates,
} from "../constants/invoice-whatsapp-templates";

import {
    Button,
} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Label,
} from "@/components/ui/label";
import {
    Textarea,
} from "@/components/ui/textarea";

// ============================================================================
// Types
// ============================================================================

type Props = {
    invoiceIds: number[];
    onSent?: () => void;
};

type StatusProgress = {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
};

// ============================================================================
// Delay Helpers
// ============================================================================

function sleep(ms: number) {
    return new Promise<void>(
        (resolve) =>
            setTimeout(
                resolve,
                ms,
            ),
    );
}

function randomInteger(
    min: number,
    max: number,
) {
    return Math.floor(
        Math.random() *
        (max - min + 1),
    ) + min;
}

// ============================================================================
// Component
// ============================================================================

export function SendSelectedOverdueWhatsAppDialog({
    invoiceIds,
    onSent,
}: Props) {
    // ==========================================================================
    // Dialog
    // ==========================================================================

    const [
        open,
        setOpen,
    ] = useState(false);

    // ==========================================================================
    // Message Mode
    // ==========================================================================

    const [
        messageMode,
        setMessageMode,
    ] = useState<
        "TEMPLATE" | "MANUAL"
    >("TEMPLATE");

    const [
        templateId,
        setTemplateId,
    ] = useState(
        invoiceWhatsAppTemplates[0].id,
    );

    const [
        manualMessage,
        setManualMessage,
    ] = useState("");

    // ==========================================================================
    // Random Delay
    // ==========================================================================

    const [
        delayMinSeconds,
        setDelayMinSeconds,
    ] = useState("5");

    const [
        delayMaxSeconds,
        setDelayMaxSeconds,
    ] = useState("15");

    const [
        delayRemaining,
        setDelayRemaining,
    ] = useState(0);

    // ==========================================================================
    // Frontend Batch Progress
    // ==========================================================================

    const [
        isSending,
        setIsSending,
    ] = useState(false);

    const [
        batchTotal,
        setBatchTotal,
    ] = useState(0);

    const [
        currentNumber,
        setCurrentNumber,
    ] = useState(0);

    const [
        queuedMessageIds,
        setQueuedMessageIds,
    ] = useState<number[]>([]);

    const [
        queueFailed,
        setQueueFailed,
    ] = useState(0);

    const [
        sendError,
        setSendError,
    ] =
        useState<string | null>(
            null,
        );

    // ==========================================================================
    // Actual WhatsApp Status
    // ==========================================================================

    const [
        statusProgress,
        setStatusProgress,
    ] = useState<StatusProgress>({
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
    });

    // ==========================================================================
    // Selected Template
    // ==========================================================================

    const selectedTemplate =
        useMemo(
            () =>
                invoiceWhatsAppTemplates.find(
                    (template) =>
                        template.id ===
                        templateId,
                ) ??
                invoiceWhatsAppTemplates[0],
            [
                templateId,
            ],
        );

    // ==========================================================================
    // Derived Progress
    // ==========================================================================

    const queuedCount =
        queuedMessageIds.length;

    const finishedCount =
        statusProgress.sent +
        statusProgress.failed +
        statusProgress.cancelled +
        queueFailed;

    const notQueuedYet =
        Math.max(
            batchTotal -
            queuedCount -
            queueFailed,
            0,
        );

    const progressPercent =
        batchTotal > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        finishedCount /
                        batchTotal
                    ) * 100,
                ),
            )
            : 0;

    const totalFailed =
        statusProgress.failed +
        statusProgress.cancelled +
        queueFailed;

    // ==========================================================================
    // Realtime Status Polling
    //
    // Polling HANYA membaca status.
    // Polling TIDAK pernah mengontrol kapan pesan berikutnya di-queue.
    // ==========================================================================

    useEffect(
        () => {
            if (
                !open ||
                queuedMessageIds.length ===
                0
            ) {
                return;
            }

            let stopped = false;

            let timer:
                | ReturnType<
                    typeof setTimeout
                >
                | undefined;

            async function poll() {
                try {
                    const result =
                        await getOverdueWhatsAppProgressAction({
                            messageIds:
                                queuedMessageIds,
                        });

                    if (stopped) {
                        return;
                    }

                    if (
                        result.success
                    ) {
                        setStatusProgress({
                            pending:
                                result.data
                                    .pending,

                            processing:
                                result.data
                                    .processing,

                            sent:
                                result.data.sent,

                            failed:
                                result.data
                                    .failed,

                            cancelled:
                                result.data
                                    .cancelled,
                        });

                        // ================================================================
                        // Stop polling hanya jika:
                        // - frontend selesai memasukkan seluruh batch
                        // - semua message yang berhasil dibuat sudah terminal
                        // ================================================================

                        if (
                            !isSending &&
                            result.data.done
                        ) {
                            return;
                        }
                    }
                } catch {
                    // ==================================================================
                    // Error polling tidak boleh menghentikan frontend sender.
                    // ==================================================================
                }

                if (!stopped) {
                    timer =
                        setTimeout(
                            poll,
                            1000,
                        );
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
        },
        [
            open,
            queuedMessageIds,
            isSending,
        ],
    );

    // ==========================================================================
    // Frontend Random Countdown
    // ==========================================================================

    async function waitRandomDelay() {
        const min =
            Number(
                delayMinSeconds,
            );

        const max =
            Number(
                delayMaxSeconds,
            );

        const seconds =
            randomInteger(
                min,
                max,
            );

        for (
            let remaining =
                seconds;
            remaining > 0;
            remaining--
        ) {
            setDelayRemaining(
                remaining,
            );

            await sleep(
                1000,
            );
        }

        setDelayRemaining(
            0,
        );
    }

    // ==========================================================================
    // Frontend Sequential Sender
    //
    // PENTING:
    // Server hanya menerima SATU invoiceId pada setiap request.
    //
    // Tidak menunggu SENT.
    // Tidak menunggu polling.
    //
    // Flow:
    // invoice 1 -> queue
    // random delay
    // invoice 2 -> queue
    // random delay
    // invoice 3 -> queue
    // ==========================================================================

    async function handleSend() {
        if (
            isSending ||
            invoiceIds.length ===
            0
        ) {
            return;
        }

        // ------------------------------------------------------------------------
        // Snapshot selected invoice.
        // Perubahan checkbox parent tidak akan mengubah batch yang sedang berjalan.
        // ------------------------------------------------------------------------

        const selectedInvoiceIds =
            [
                ...invoiceIds,
            ];

        setIsSending(true);

        setBatchTotal(
            selectedInvoiceIds.length,
        );

        setCurrentNumber(
            0,
        );

        setDelayRemaining(
            0,
        );

        setQueuedMessageIds(
            [],
        );

        setQueueFailed(
            0,
        );

        setSendError(
            null,
        );

        setStatusProgress({
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            cancelled: 0,
        });

        let failedToQueue =
            0;

        try {
            // ======================================================================
            // Kirim invoice satu per satu.
            // ======================================================================

            for (
                let index = 0;
                index <
                selectedInvoiceIds.length;
                index++
            ) {
                const invoiceId =
                    selectedInvoiceIds[
                    index
                    ];

                setCurrentNumber(
                    index + 1,
                );

                // ====================================================================
                // Queue SATU pesan
                // ====================================================================

                try {
                    const result =
                        await sendOverdueInvoicesWhatsAppAction({
                            invoiceIds: [
                                invoiceId,
                            ],

                            messageMode,

                            templateId:
                                messageMode ===
                                    "TEMPLATE"
                                    ? templateId
                                    : undefined,

                            manualMessage:
                                messageMode ===
                                    "MANUAL"
                                    ? manualMessage
                                    : undefined,

                            // ==============================================================
                            // Backend hanya menerima satu pesan.
                            // Delay backend tidak dipakai.
                            // ==============================================================
                            delayMinSeconds:
                                1,

                            delayMaxSeconds:
                                1,
                        });

                    // ==================================================================
                    // Queue berhasil
                    // ==================================================================

                    if (
                        result.success &&
                        result.data
                            .messageIds
                            .length > 0
                    ) {
                        setQueuedMessageIds(
                            (current) => [
                                ...current,

                                ...result.data
                                    .messageIds,
                            ],
                        );
                    } else {
                        // ================================================================
                        // Invoice tidak berhasil dibuat menjadi message queue.
                        // Misalnya duplicate, nomor invalid, bukan overdue, dll.
                        // ================================================================

                        failedToQueue++;

                        setQueueFailed(
                            failedToQueue,
                        );

                        if (
                            !result.success
                        ) {
                            setSendError(
                                result.message,
                            );
                        }
                    }
                } catch (
                error
                ) {
                    // ==================================================================
                    // Satu request gagal tidak menghentikan invoice berikutnya.
                    // ==================================================================

                    failedToQueue++;

                    setQueueFailed(
                        failedToQueue,
                    );

                    setSendError(
                        error instanceof Error
                            ? error.message
                            : "Salah satu pesan gagal dimasukkan antrean.",
                    );
                }

                // ====================================================================
                // Pesan terakhir tidak perlu delay lagi.
                // ====================================================================

                if (
                    index ===
                    selectedInvoiceIds.length -
                    1
                ) {
                    continue;
                }

                // ====================================================================
                // Delay random SEPENUHNYA dari frontend.
                // ====================================================================

                await waitRandomDelay();
            }

            // ======================================================================
            // Seluruh selected invoice sudah dicoba.
            // ======================================================================

            onSent?.();
        } catch (
        error
        ) {
            setSendError(
                error instanceof Error
                    ? error.message
                    : "Terjadi kesalahan saat mengirim WhatsApp.",
            );
        } finally {
            setIsSending(
                false,
            );

            setDelayRemaining(
                0,
            );
        }
    }

    // ==========================================================================
    // Reset Batch when Opening
    // ==========================================================================

    function handleOpen() {
        setSendError(
            null,
        );

        setBatchTotal(
            0,
        );

        setCurrentNumber(
            0,
        );

        setDelayRemaining(
            0,
        );

        setQueuedMessageIds(
            [],
        );

        setQueueFailed(
            0,
        );

        setStatusProgress({
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            cancelled: 0,
        });

        setOpen(
            true,
        );
    }

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <>
            <Button
                type="button"
                disabled={
                    invoiceIds.length ===
                    0
                }
                onClick={
                    handleOpen
                }
            >
                <MessageCircle />

                Kirim WA

                {invoiceIds.length >
                    0 &&
                    ` (${invoiceIds.length})`}
            </Button>

            <Dialog
                open={open}
                onOpenChange={(
                    value,
                ) => {
                    // ==================================================================
                    // Jangan tutup dialog saat frontend masih menjalankan batch.
                    // ==================================================================

                    if (
                        isSending &&
                        !value
                    ) {
                        return;
                    }

                    setOpen(
                        value,
                    );
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Kirim WhatsApp
                            Tunggakan
                        </DialogTitle>

                        <DialogDescription>
                            {
                                invoiceIds.length
                            }{" "}
                            invoice dipilih.
                            Pesan akan dikirim
                            satu per satu dengan
                            jeda random dari
                            frontend.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* ============================================================ */}
                        {/* Message Mode */}
                        {/* ============================================================ */}

                        <div className="space-y-2">
                            <Label>
                                Jenis Pesan
                            </Label>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        messageMode ===
                                            "TEMPLATE"
                                            ? "default"
                                            : "outline"
                                    }
                                    disabled={
                                        isSending
                                    }
                                    onClick={() =>
                                        setMessageMode(
                                            "TEMPLATE",
                                        )
                                    }
                                >
                                    Template
                                </Button>

                                <Button
                                    type="button"
                                    variant={
                                        messageMode ===
                                            "MANUAL"
                                            ? "default"
                                            : "outline"
                                    }
                                    disabled={
                                        isSending
                                    }
                                    onClick={() =>
                                        setMessageMode(
                                            "MANUAL",
                                        )
                                    }
                                >
                                    Pesan Manual
                                </Button>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/* Template */}
                        {/* ============================================================ */}

                        {messageMode ===
                            "TEMPLATE" && (
                                <div className="space-y-2">
                                    <Label htmlFor="wa-template">
                                        Template
                                    </Label>

                                    <select
                                        id="wa-template"
                                        value={
                                            templateId
                                        }
                                        disabled={
                                            isSending
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setTemplateId(
                                                event
                                                    .target
                                                    .value as typeof templateId,
                                            )
                                        }
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        {invoiceWhatsAppTemplates.map(
                                            (
                                                template,
                                            ) => (
                                                <option
                                                    key={
                                                        template.id
                                                    }
                                                    value={
                                                        template.id
                                                    }
                                                >
                                                    {
                                                        template.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <div className="rounded-md border bg-muted/30 p-3">
                                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                                            Preview Template
                                        </p>

                                        <p className="whitespace-pre-wrap text-sm">
                                            {
                                                selectedTemplate.body
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                        {/* ============================================================ */}
                        {/* Manual Message */}
                        {/* ============================================================ */}

                        {messageMode ===
                            "MANUAL" && (
                                <div className="space-y-2">
                                    <Label htmlFor="manual-message">
                                        Pesan
                                    </Label>

                                    <Textarea
                                        id="manual-message"
                                        value={
                                            manualMessage
                                        }
                                        disabled={
                                            isSending
                                        }
                                        rows={10}
                                        placeholder={`Halo {{nama}},

Tagihan {{invoice}} sebesar {{sisa_tagihan}} telah jatuh tempo pada {{jatuh_tempo}}.

Mohon segera melakukan pembayaran.`}
                                        onChange={(
                                            event,
                                        ) =>
                                            setManualMessage(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                    />
                                </div>
                            )}

                        {/* ============================================================ */}
                        {/* Placeholder */}
                        {/* ============================================================ */}

                        <div className="rounded-md border p-3">
                            <p className="text-sm font-medium">
                                Placeholder
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <code className="rounded bg-muted px-2 py-1">
                                    {
                                        "{{nama}}"
                                    }
                                </code>

                                <code className="rounded bg-muted px-2 py-1">
                                    {
                                        "{{invoice}}"
                                    }
                                </code>

                                <code className="rounded bg-muted px-2 py-1">
                                    {
                                        "{{jatuh_tempo}}"
                                    }
                                </code>

                                <code className="rounded bg-muted px-2 py-1">
                                    {
                                        "{{sisa_tagihan}}"
                                    }
                                </code>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/* Random Delay */}
                        {/* ============================================================ */}

                        <div className="space-y-2">
                            <Label>
                                Jeda Antar Pesan
                            </Label>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="delay-min"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Minimum
                                    </Label>

                                    <div className="relative">
                                        <input
                                            id="delay-min"
                                            type="number"
                                            min={1}
                                            max={3600}
                                            value={
                                                delayMinSeconds
                                            }
                                            disabled={
                                                isSending
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setDelayMinSeconds(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            className="h-9 w-full rounded-md border bg-background px-3 pr-14 text-sm"
                                        />

                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                            detik
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor="delay-max"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Maksimum
                                    </Label>

                                    <div className="relative">
                                        <input
                                            id="delay-max"
                                            type="number"
                                            min={1}
                                            max={3600}
                                            value={
                                                delayMaxSeconds
                                            }
                                            disabled={
                                                isSending
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setDelayMaxSeconds(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            className="h-9 w-full rounded-md border bg-background px-3 pr-14 text-sm"
                                        />

                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                            detik
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Jeda random{" "}
                                {
                                    delayMinSeconds
                                }
                                –
                                {
                                    delayMaxSeconds
                                }{" "}
                                detik sebelum
                                frontend mengirim
                                invoice berikutnya.
                            </p>
                        </div>

                        {/* ============================================================ */}
                        {/* Realtime Progress */}
                        {/* ============================================================ */}

                        {batchTotal >
                            0 && (
                                <div className="space-y-4 rounded-lg border p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                Progress Pengiriman
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {isSending
                                                    ? `Memproses ${currentNumber} dari ${batchTotal}`
                                                    : finishedCount >=
                                                        batchTotal
                                                        ? "Pengiriman selesai"
                                                        : "Menunggu status WhatsApp"}
                                            </p>
                                        </div>

                                        <p className="text-lg font-semibold tabular-nums">
                                            {
                                                progressPercent
                                            }
                                            %
                                        </p>
                                    </div>

                                    {/* ======================================================== */}
                                    {/* Progress Bar */}
                                    {/* ======================================================== */}

                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-[width] duration-300"
                                            style={{
                                                width:
                                                    `${progressPercent}%`,
                                            }}
                                        />
                                    </div>

                                    {/* ======================================================== */}
                                    {/* Status Counters */}
                                    {/* ======================================================== */}

                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                        <div className="rounded-md border p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Terkirim
                                            </p>

                                            <p className="text-xl font-semibold">
                                                {
                                                    statusProgress.sent
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-md border p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Diproses
                                            </p>

                                            <p className="text-xl font-semibold">
                                                {
                                                    statusProgress.processing
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-md border p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Menunggu
                                            </p>

                                            <p className="text-xl font-semibold">
                                                {
                                                    statusProgress.pending
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-md border p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Belum Dikirim
                                            </p>

                                            <p className="text-xl font-semibold">
                                                {
                                                    notQueuedYet
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-md border p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Gagal
                                            </p>

                                            <p className="text-xl font-semibold text-destructive">
                                                {
                                                    totalFailed
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* ======================================================== */}
                                    {/* Frontend Random Countdown */}
                                    {/* ======================================================== */}

                                    {delayRemaining >
                                        0 && (
                                            <div className="rounded-md border bg-muted/30 p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm text-muted-foreground">
                                                        Pesan
                                                        berikutnya
                                                        dikirim
                                                        dalam
                                                    </p>

                                                    <p className="text-xl font-semibold tabular-nums">
                                                        {
                                                            delayRemaining
                                                        }{" "}
                                                        detik
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                    <p className="text-xs text-muted-foreground">
                                        {
                                            queuedCount
                                        }{" "}
                                        masuk antrean ·{" "}
                                        {
                                            finishedCount
                                        }{" "}
                                        selesai dari{" "}
                                        {
                                            batchTotal
                                        }
                                    </p>
                                </div>
                            )}

                        {/* ============================================================ */}
                        {/* Error */}
                        {/* ============================================================ */}

                        {sendError && (
                            <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                                {
                                    sendError
                                }
                            </div>
                        )}
                    </div>

                    {/* ================================================================== */}
                    {/* Footer */}
                    {/* ================================================================== */}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                isSending
                            }
                            onClick={() =>
                                setOpen(
                                    false,
                                )
                            }
                        >
                            Tutup
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                isSending ||
                                invoiceIds.length ===
                                0 ||
                                Number(
                                    delayMinSeconds,
                                ) < 1 ||
                                Number(
                                    delayMaxSeconds,
                                ) <
                                Number(
                                    delayMinSeconds,
                                ) ||
                                (
                                    messageMode ===
                                    "MANUAL" &&
                                    !manualMessage.trim()
                                )
                            }
                            onClick={() =>
                                void handleSend()
                            }
                        >
                            {isSending && (
                                <Loader2 className="animate-spin" />
                            )}

                            {isSending
                                ? `Mengirim ${currentNumber}/${batchTotal}`
                                : `Kirim ${invoiceIds.length} Pesan`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}