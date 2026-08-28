"use client";

import {
    useActionState,
    useEffect,
} from "react";

import {
    Loader2,
    ShieldCheck,
} from "lucide-react";

import {
    toast,
} from "sonner";

import { restoreCustomerAction } from "@/features/customers/actions/restore-customer.action";
import { initialRestoreCustomerState } from "@/features/customers/types/restore-customer-action-state";

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
        pppProfileName: string;
    };

    open: boolean;

    onOpenChange: (
        open: boolean,
    ) => void;
};

export function RestoreCustomerDialog({
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
                    <RestoreCustomerForm
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

function RestoreCustomerForm({
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
        restoreCustomerAction,
        initialRestoreCustomerState,
    );

    useEffect(() => {
        if (
            state.success !== true
        ) {
            return;
        }

        toast.success(
            "Isolir dibuka",
            {
                description:
                    `${customer.pppoeUsername} dikembalikan ke profile ${customer.pppProfileName}.`,
            },
        );

        onSuccess();
    }, [
        state.success,
        customer.pppoeUsername,
        customer.pppProfileName,
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
            "Gagal membuka isolir",
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
                    Buka Isolir Customer?
                </AlertDialogTitle>

                <AlertDialogDescription>
                    PPP Profile MikroTik
                    akan dikembalikan ke
                    profile asli yang
                    tersimpan di database.
                </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="rounded-lg border bg-muted/20 p-4">
                <dl className="grid gap-3 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">
                            Customer
                        </dt>

                        <dd className="text-right font-medium">
                            {
                                customer.name
                            }
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
                            Profile kembali
                        </dt>

                        <dd className="text-right font-semibold text-green-600">
                            {
                                customer.pppProfileName
                            }
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
                        {
                            state.message
                        }
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
                    disabled={
                        isPending
                    }
                    className="bg-green-600 text-white hover:bg-green-700"
                >
                    {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <ShieldCheck className="size-4" />
                    )}

                    {isPending
                        ? "Membuka..."
                        : "Buka Isolir"}
                </Button>
            </div>
        </form>
    );
}