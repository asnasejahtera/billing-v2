"use client";

import {
    CheckCircle2,
    Clock3,
    Loader2,
    Send,
    XCircle,
} from "lucide-react";

import {
    useEffect,
    useState,
    useTransition,
} from "react";

import {
    toast,
} from "sonner";

import {
    Button,
} from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Input,
} from "@/components/ui/input";

import {
    getCustomerMessageStatusAction,
    sendCustomerMessageAction,
} from "../../actions/customer-message-send.actions";

/**
 * ============================================
 * TYPES
 * ============================================
 */
type Template = {
    id: number;
    name: string;
    body: string;
};

type DeliveryStatus = {
    total: number;
    waiting: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
    complete: boolean;
};

type Props = {
    customerIds: number[];
    templates: Template[];
    onSuccess?: () => void;
};

/**
 * ============================================
 * DIALOG
 * ============================================
 */
export function SendCustomerMessageDialog({
    customerIds,
    templates,
    onSuccess,
}: Props) {
    const [
        open,
        setOpen,
    ] =
        useState(false);

    const [
        templateId,
        setTemplateId,
    ] =
        useState("");

    const [
        body,
        setBody,
    ] =
        useState("");

    const [
        minDelay,
        setMinDelay,
    ] =
        useState(1);

    const [
        maxDelay,
        setMaxDelay,
    ] =
        useState(10);

    const [
        messageIds,
        setMessageIds,
    ] =
        useState<number[]>(
            [],
        );

    const [
        delivery,
        setDelivery,
    ] =
        useState<DeliveryStatus | null>(
            null,
        );

    const [
        pending,
        startTransition,
    ] =
        useTransition();

    const tracking =
        messageIds.length > 0;

    /**
     * ========================================
     * RESET
     * ========================================
     */
    function reset() {
        setMessageIds([]);
        setDelivery(null);
        setTemplateId("");
        setBody("");
        setMinDelay(1);
        setMaxDelay(10);
    }

    /**
     * ========================================
     * OPEN CHANGE
     * ========================================
     */
    function handleOpenChange(
        value: boolean,
    ) {
        setOpen(value);

        if (!value) {
            reset();
        }
    }

    /**
     * ========================================
     * TEMPLATE
     * ========================================
     */
    function changeTemplate(
        value: string,
    ) {
        setTemplateId(value);

        const template =
            templates.find(
                (item) =>
                    item.id ===
                    Number(value),
            );

        setBody(
            template?.body ??
            "",
        );
    }

    /**
     * ========================================
     * SEND
     * ========================================
     */
    function send() {
        startTransition(
            async () => {
                const result =
                    await sendCustomerMessageAction({
                        customerIds,
                        body,
                        minDelaySec:
                            minDelay,
                        maxDelaySec:
                            maxDelay,
                    });

                if (
                    !result.success
                ) {
                    toast.error(
                        result.message,
                    );
                    return;
                }

                /**
                 * Simpan ID batch yang barusan dibuat.
                 */
                setMessageIds(
                    result.messageIds,
                );

                setDelivery({
                    total:
                        result.messageIds.length,
                    waiting:
                        result.messageIds.length,
                    processing:
                        0,
                    sent:
                        0,
                    failed:
                        0,
                    cancelled:
                        0,
                    complete:
                        false,
                });

                toast.success(
                    result.message,
                );

                /**
                 * Selection table boleh langsung kosong,
                 * status tetap mengikuti messageIds lokal.
                 */
                onSuccess?.();
            },
        );
    }

    /**
     * ========================================
     * REALTIME POLLING
     * ========================================
     *
     * Poll setiap 1 detik.
     * Otomatis berhenti setelah batch selesai.
     */
    useEffect(() => {
        if (
            !open ||
            !messageIds.length
        ) {
            return;
        }

        let stopped =
            false;

        let timer:
            ReturnType<typeof setTimeout> |
            undefined;

        async function poll() {
            if (stopped) {
                return;
            }

            const result =
                await getCustomerMessageStatusAction({
                    messageIds,
                });

            if (
                stopped
            ) {
                return;
            }

            if (
                result.success
            ) {
                setDelivery(
                    result.status,
                );

                /**
                 * Semua terminal:
                 * polling selesai.
                 */
                if (
                    result.status
                        .complete
                ) {
                    return;
                }
            }

            timer =
                setTimeout(
                    poll,
                    1000,
                );
        }

        void poll();

        return () => {
            stopped =
                true;

            if (timer) {
                clearTimeout(
                    timer,
                );
            }
        };
    }, [
        open,
        messageIds,
    ]);

    /**
     * ========================================
     * PROGRESS
     * ========================================
     */
    const finished =
        (delivery?.sent ??
            0) +
        (delivery?.failed ??
            0) +
        (delivery?.cancelled ??
            0);

    const progress =
        delivery &&
            delivery.total > 0
            ? Math.round(
                (
                    finished /
                    delivery.total
                ) *
                100,
            )
            : 0;

    return (
        <>
            {/* ======================================
          OPEN
      ====================================== */}
            <Button
                type="button"
                disabled={
                    customerIds.length ===
                    0
                }
                onClick={() => {
                    reset();
                    setOpen(true);
                }}
            >
                <Send />
                Kirim Pesan ({customerIds.length})
            </Button>

            {/* ======================================
          DIALOG
      ====================================== */}
            <Dialog
                open={open}
                onOpenChange={
                    handleOpenChange
                }
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Kirim Pesan Customer
                        </DialogTitle>

                        <DialogDescription>
                            Pesan dikirim melalui antrean WhatsApp satu per satu.
                        </DialogDescription>
                    </DialogHeader>

                    {/* ==================================
              BEFORE SEND
          ================================== */}
                    {!tracking && (
                        <div className="space-y-4">
                            <div className="rounded-md border bg-muted/30 p-3">
                                <p className="text-sm font-medium">
                                    {customerIds.length} customer dipilih
                                </p>
                            </div>

                            {/* ==============================
                  TEMPLATE
              ============================== */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Template
                                </label>

                                <select
                                    value={
                                        templateId
                                    }
                                    disabled={
                                        pending
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        changeTemplate(
                                            event.target
                                                .value,
                                        )
                                    }
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="">
                                        Pesan Manual
                                    </option>

                                    {templates.map(
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
                                                {template.name}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* ==============================
                  MESSAGE
              ============================== */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Pesan
                                </label>

                                <textarea
                                    value={body}
                                    disabled={
                                        pending
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setBody(
                                            event.target
                                                .value,
                                        )
                                    }
                                    rows={8}
                                    placeholder={`Halo {{customer_name}},\n\nIsi pesan...`}
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none"
                                />

                                <p className="text-xs text-muted-foreground">
                                    Variable: {"{{customer_name}}"}
                                </p>
                            </div>

                            {/* ==============================
                  DELAY
              ============================== */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Delay Minimum
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={300}
                                            value={
                                                minDelay
                                            }
                                            disabled={
                                                pending
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setMinDelay(
                                                    Number(
                                                        event
                                                            .target
                                                            .value,
                                                    ),
                                                )
                                            }
                                        />

                                        <span className="text-sm text-muted-foreground">
                                            detik
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Delay Maksimum
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={300}
                                            value={
                                                maxDelay
                                            }
                                            disabled={
                                                pending
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setMaxDelay(
                                                    Number(
                                                        event
                                                            .target
                                                            .value,
                                                    ),
                                                )
                                            }
                                        />

                                        <span className="text-sm text-muted-foreground">
                                            detik
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ==============================
                  ACTION
              ============================== */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        pending
                                    }
                                    onClick={() =>
                                        setOpen(false)
                                    }
                                >
                                    Batal
                                </Button>

                                <Button
                                    type="button"
                                    disabled={
                                        pending ||
                                        !body.trim() ||
                                        customerIds.length ===
                                        0
                                    }
                                    onClick={
                                        send
                                    }
                                >
                                    {pending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <Send />
                                    )}

                                    {pending
                                        ? "Memproses..."
                                        : `Kirim ${customerIds.length} Pesan`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ==================================
              REALTIME DELIVERY
          ================================== */}
                    {tracking &&
                        delivery && (
                            <div className="space-y-4">
                                {/* ==============================
                  COUNTERS
              ============================== */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-lg border p-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle2 className="size-4" />
                                            <span className="text-xs">
                                                Terkirim
                                            </span>
                                        </div>

                                        <p className="mt-1 text-2xl font-semibold">
                                            {delivery.sent}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border p-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <XCircle className="size-4" />
                                            <span className="text-xs">
                                                Gagal
                                            </span>
                                        </div>

                                        <p className="mt-1 text-2xl font-semibold">
                                            {delivery.failed}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border p-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock3 className="size-4" />
                                            <span className="text-xs">
                                                Menunggu
                                            </span>
                                        </div>

                                        <p className="mt-1 text-2xl font-semibold">
                                            {delivery.waiting}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border p-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2
                                                className={
                                                    delivery.processing >
                                                        0
                                                        ? "size-4 animate-spin"
                                                        : "size-4"
                                                }
                                            />

                                            <span className="text-xs">
                                                Diproses
                                            </span>
                                        </div>

                                        <p className="mt-1 text-2xl font-semibold">
                                            {delivery.processing}
                                        </p>
                                    </div>
                                </div>

                                {/* ==============================
                  PROGRESS
              ============================== */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>
                                            Progress
                                        </span>

                                        <span>
                                            {finished} / {delivery.total}
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-[width]"
                                            style={{
                                                width:
                                                    `${progress}%`,
                                            }}
                                        />
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {progress}% selesai
                                    </p>
                                </div>

                                {/* ==============================
                  STATUS
              ============================== */}
                                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                    {delivery.complete ? (
                                        <p>
                                            Pengiriman selesai.{" "}
                                            <strong>
                                                {delivery.sent}
                                            </strong>{" "}
                                            terkirim,{" "}
                                            <strong>
                                                {delivery.failed}
                                            </strong>{" "}
                                            gagal.
                                        </p>
                                    ) : (
                                        <p>
                                            Pengiriman sedang berjalan. Status diperbarui otomatis.
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant={
                                            delivery.complete
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            setOpen(false)
                                        }
                                    >
                                        {delivery.complete
                                            ? "Tutup"
                                            : "Tutup Dialog"}
                                    </Button>
                                </div>
                            </div>
                        )}
                </DialogContent>
            </Dialog>
        </>
    );
}