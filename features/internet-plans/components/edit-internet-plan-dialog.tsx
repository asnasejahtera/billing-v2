"use client";

import {
    useActionState,
    useEffect,
} from "react";
import {
    Loader2,
    Save,
} from "lucide-react";
import { updateInternetPlanAction } from "@/features/internet-plans/actions/update-internet-plan.action";
import { initialUpdateInternetPlanState } from "@/features/internet-plans/types/update-internet-plan-action-state";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type EditInternetPlanDialogProps = {
    plan: {
        id: number;
        name: string;
        price: string;
    };
    open: boolean;
    onOpenChange: (
        open: boolean,
    ) => void;
};

export function EditInternetPlanDialog({
    plan,
    open,
    onOpenChange,
}: EditInternetPlanDialogProps) {
    const [
        state,
        formAction,
        isPending,
    ] = useActionState(
        updateInternetPlanAction,
        initialUpdateInternetPlanState,
    );

    useEffect(() => {
        if (!state.success) {
            return;
        }

        toast.add({
            type: "success",
            title:
                "Paket diperbarui",
            description:
                state.message,
        });

        onOpenChange(false);
    }, [
        state.success,
        state.message,
        onOpenChange,
    ]);

    return (
        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Edit Paket Internet
                    </DialogTitle>

                    <DialogDescription>
                        Hanya nama paket dan harga
                        yang dapat diubah secara lokal.
                    </DialogDescription>
                </DialogHeader>

                <form
                    action={formAction}
                    className="space-y-5"
                >
                    <input
                        type="hidden"
                        name="id"
                        value={plan.id}
                    />

                    {state.success === false &&
                        state.message && (
                            <div
                                role="alert"
                                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            >
                                {state.message}
                            </div>
                        )}

                    <div className="space-y-2">
                        <Label
                            htmlFor={`plan-name-${plan.id}`}
                        >
                            Nama Paket
                        </Label>

                        <Input
                            id={`plan-name-${plan.id}`}
                            name="name"
                            defaultValue={
                                plan.name
                            }
                            disabled={
                                isPending
                            }
                            aria-invalid={Boolean(
                                state.errors?.name,
                            )}
                        />

                        {state.errors
                            ?.name?.[0] && (
                                <p className="text-xs text-destructive">
                                    {
                                        state.errors
                                            .name[0]
                                    }
                                </p>
                            )}
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor={`plan-price-${plan.id}`}
                        >
                            Harga
                        </Label>

                        <Input
                            id={`plan-price-${plan.id}`}
                            name="price"
                            type="number"
                            min={0}
                            step={1}
                            defaultValue={Math.round(
                                Number(
                                    plan.price,
                                ),
                            )}
                            disabled={
                                isPending
                            }
                            aria-invalid={Boolean(
                                state.errors?.price,
                            )}
                        />

                        {state.errors
                            ?.price?.[0] && (
                                <p className="text-xs text-destructive">
                                    {
                                        state.errors
                                            .price[0]
                                    }
                                </p>
                            )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                isPending
                            }
                            onClick={() =>
                                onOpenChange(false)
                            }
                        >
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                isPending
                            }
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Save />
                            )}

                            {isPending
                                ? "Menyimpan..."
                                : "Simpan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}