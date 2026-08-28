"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import {
    Loader2,
    RefreshCw,
    Router,
    Wifi,
    WifiOff,
} from "lucide-react";
import { syncInternetPlansAction } from "@/features/internet-plans/actions/sync-internet-plans.action";
import { initialSyncInternetPlansState } from "@/features/internet-plans/types/sync-internet-plans-action-state";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type RouterOption = {
    id: number;
    name: string;
    host: string;
    connectionStatus:
    | "UNKNOWN"
    | "ONLINE"
    | "OFFLINE";
};

type SyncInternetPlansProps = {
    routers: RouterOption[];
};

export function SyncInternetPlans({
    routers,
}: SyncInternetPlansProps) {
    const [routerId, setRouterId] =
        useState(
            routers[0]
                ? String(routers[0].id)
                : "",
        );

    const [
        state,
        formAction,
        isPending,
    ] = useActionState(
        syncInternetPlansAction,
        initialSyncInternetPlansState,
    );

    useEffect(() => {
        if (
            state.success === undefined
        ) {
            return;
        }

        toast.add({
            type:
                state.success
                    ? "success"
                    : "error",
            title:
                state.success
                    ? "Sinkron berhasil"
                    : "Sinkron gagal",
            description:
                state.message,
        });
    }, [
        state.success,
        state.message,
    ]);

    const selected =
        routers.find(
            (router) =>
                String(router.id) ===
                routerId,
        );

    return (
        <form
            action={formAction}
            className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
        >
            <input
                type="hidden"
                name="routerId"
                value={routerId}
            />

            <div className="relative min-w-0">
                <Router className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <select
                    value={routerId}
                    onChange={(event) =>
                        setRouterId(
                            event.target.value,
                        )
                    }
                    disabled={
                        isPending ||
                        routers.length === 0
                    }
                    className="h-9 w-full min-w-60 rounded-md border bg-background pl-9 pr-8 text-sm sm:w-auto"
                >
                    {routers.length === 0 ? (
                        <option value="">
                            Tidak ada router aktif
                        </option>
                    ) : (
                        routers.map(
                            (router) => (
                                <option
                                    key={router.id}
                                    value={router.id}
                                >
                                    {router.name} ·{" "}
                                    {router.host}
                                </option>
                            ),
                        )
                    )}
                </select>
            </div>

            <Button
                type="submit"
                disabled={
                    isPending ||
                    !routerId
                }
            >
                {isPending ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <RefreshCw />
                )}

                {isPending
                    ? "Sinkron..."
                    : "Sync MikroTik"}
            </Button>

            {selected && (
                <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground sm:hidden">
                    {selected.connectionStatus ===
                        "ONLINE" ? (
                        <Wifi className="size-3.5 text-green-500" />
                    ) : selected.connectionStatus ===
                        "OFFLINE" ? (
                        <WifiOff className="size-3.5 text-destructive" />
                    ) : null}

                    {selected.connectionStatus}
                </div>
            )}
        </form>
    );
}