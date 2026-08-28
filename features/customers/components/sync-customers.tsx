"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import {
    Loader2,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { syncCustomersAction } from "@/features/customers/actions/sync-customers.action";
import { initialSyncCustomersState } from "@/features/customers/types/sync-customers-action-state";
import { Button } from "@/components/ui/button";

type RouterOption = {
    id: number;
    name: string;
    host: string;
};

export function SyncCustomers({
    routers,
}: {
    routers: RouterOption[];
}) {
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
        syncCustomersAction,
        initialSyncCustomersState,
    );

    useEffect(() => {
        if (
            state.success === undefined
        ) {
            return;
        }

        if (state.success) {
            toast.success(
                "Sinkron Customer berhasil",
                {
                    description:
                        state.message,
                },
            );
        } else {
            toast.error(
                "Sinkron Customer gagal",
                {
                    description:
                        state.message,
                },
            );
        }
    }, [
        state.success,
        state.message,
    ]);

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
                className="h-9 min-w-60 rounded-md border bg-background px-3 text-sm"
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
        </form>
    );
}