"use client";

import {
    Loader2,
    RadioTower,
} from "lucide-react";
import {
    useTransition,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { syncCustomersOltAction } from "@/features/customers/actions/sync-customers-olt.action";

export function SyncOltCustomers() {
    const [
        isPending,
        startTransition,
    ] = useTransition();

    function handleSync() {
        startTransition(
            async () => {
                const result =
                    await syncCustomersOltAction();

                if (!result.success) {
                    toast.error(
                        result.message,
                    );

                    return;
                }

                const data =
                    result.data;

                if (data.failed > 0) {
                    toast.warning(
                        `${data.updated} berhasil, ${data.failed} gagal`,
                        {
                            description:
                                `${data.notMatched} tidak cocok, ${data.noCallerId} belum memiliki Caller ID`,
                        },
                    );

                    return;
                }

                toast.success(
                    result.message,
                    {
                        description:
                            `${data.notMatched} tidak cocok • ${data.noCallerId} tanpa Caller ID`,
                    },
                );
            },
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={
                handleSync
            }
            disabled={
                isPending
            }
        >
            {isPending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <RadioTower className="size-4" />
            )}

            {isPending
                ? "Sinkron OLT..."
                : "Sinkron OLT"}
        </Button>
    );
}