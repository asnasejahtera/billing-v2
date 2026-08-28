"use client";

import {
    useActionState,
    useEffect,
} from "react";
import {
    Ban,
    Loader2,
} from "lucide-react";
import {
    toast,
} from "sonner";
import { isolateCustomerAction } from "@/features/customers/actions/isolate-customer.action";
import { initialIsolateCustomerState } from "@/features/customers/types/isolate-customer-action-state";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
    customer: {
        id: number;
        name: string;
        pppoeUsername: string;
        routerName: string;
    };

    open: boolean;

    onOpenChange: (
        open: boolean,
    ) => void;
};

export function IsolateCustomerDialog({
    customer,
    open,
    onOpenChange,
}: Props) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >
            <AlertDialogContent>
                {open && (
                    <IsolateCustomerForm
                        customer={
                            customer
                        }
                        onCancel={() =>
                            onOpenChange(
                                false,
                            )
                        }
                        onSuccess={() =>
                            onOpenChange(
                                false,
                            )
                        }
                    />
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}

function IsolateCustomerForm({
    customer,
    onCancel,
    onSuccess,
}: {
    customer:
    Props["customer"];

    onCancel:
    () => void;

    onSuccess:
    () => void;
}) {
    const [
        state,
        formAction,
        isPending,
    ] = useActionState(
        isolateCustomerAction,
        initialIsolateCustomerState,
    );

    useEffect(() => {
        if (
            state.success !== true
        ) {
            return;
        }

        toast.success(
            "Customer berhasil diisolir",
            {
                description:
                    `${customer.pppoeUsername} sekarang menggunakan profile isolir.`,
            },
        );

        onSuccess();
    }, [
        state.success,
        customer.pppoeUsername,
        onSuccess,
    ]);

    useEffect(() => {
        if (
            state.success !==
            false ||
            !state.message
        ) {
            return;
        }

        toast.error(
            "Gagal mengisolir Customer",
            {
                description:
                    state.message,
            },
        );
    }, [
        state.success,
        state.message,
    ]);

    return (
        <form
            action={formAction}
            className="space-y-5"
        >
            <input
                type="hidden"
                name="customerId"
                value={customer.id}
            />

            <AlertDialogHeader>
                <AlertDialogTitle>
                    Isolir Customer?
                </AlertDialogTitle>

                <AlertDialogDescription>
                    PPP Profile Customer
                    akan diubah menjadi
                    profile isolir pada
                    MikroTik dan status
                    Customer pada database
                    menjadi Suspend.
                </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="rounded-md border p-3 text-sm">
                <dl className="grid gap-2">
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">
                            Customer
                        </dt>

                        <dd className="text-right font-medium">
                            {customer.name}
                        </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">
                            PPPoE User
                        </dt>

                        <dd className="text-right font-mono">
                            {
                                customer.pppoeUsername
                            }
                        </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">
                            Router
                        </dt>

                        <dd className="text-right">
                            {
                                customer.routerName
                            }
                        </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">
                            Profile baru
                        </dt>

                        <dd className="text-right font-medium">
                            isolir
                        </dd>
                    </div>
                </dl>
            </div>

            {state.success ===
                false &&
                state.message && (
                    <p
                        role="alert"
                        className="text-sm text-destructive"
                    >
                        {state.message}
                    </p>
                )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    disabled={
                        isPending
                    }
                    onClick={
                        onCancel
                    }
                >
                    Batal
                </Button>

                <Button
                    type="submit"
                    variant="destructive"
                    disabled={
                        isPending
                    }
                >
                    {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Ban className="size-4" />
                    )}

                    {isPending
                        ? "Mengisolir..."
                        : "Ya, Isolir"}
                </Button>
            </div>
        </form>
    );
}