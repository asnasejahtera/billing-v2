"use client";

import {
    useActionState,
    useEffect,
} from "react";
import {
    Loader2,
    Wifi,
} from "lucide-react";
import { testRouterConnectionAction } from "@/features/routers/actions/test-router-connection.action";
import { initialTestRouterConnectionState } from "@/features/routers/types/test-router-connection-action-state";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type TestRouterConnectionButtonProps = {
    routerId: number;
    disabled?: boolean;
    onResult?: (
        success: boolean,
    ) => void;
};

export function TestRouterConnectionButton({
    routerId,
    disabled = false,
    onResult
}: TestRouterConnectionButtonProps) {
    const [
        state,
        formAction,
        isPending,
    ] = useActionState(
        testRouterConnectionAction,
        initialTestRouterConnectionState,
    );

    useEffect(() => {
        if (
            state.success === undefined
        ) {
            return;
        }

        onResult?.(state.success);

        toast.add({
            type:
                state.success
                    ? "success"
                    : "error",
            title:
                state.success
                    ? "Koneksi berhasil"
                    : "Koneksi gagal",
            description: state.message,
        });
    }, [
        state.success,
        state.message,
        onResult,
    ]);

    return (
        <form action={formAction}>
            <input
                type="hidden"
                name="id"
                value={routerId}
            />

            <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={
                    disabled ||
                    isPending
                }
            >
                {isPending ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <Wifi />
                )}

                {isPending
                    ? "Testing..."
                    : "Test"}
            </Button>
        </form>
    );
}