"use client";

import {
    useActionState,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Loader2,
    Save,
} from "lucide-react";
import {
    toast,
} from "sonner";
import { updateCustomerAction } from "@/features/customers/actions/update-customer.action";
import { initialUpdateCustomerState } from "@/features/customers/types/update-customer-action-state";
import { Button } from "@/components/ui/button";
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
    Label,
} from "@/components/ui/label";
import {
    Textarea,
} from "@/components/ui/textarea";

type PlanOption = {
    id: number;
    name: string;
    routerId: number;
    pppProfileName: string;
    bandwidthUpTo: string;
    price: string;
};

export type EditCustomerData = {
    id: number;

    name: string;
    phone: string | null;

    routerId: number;
    routerName: string;

    internetPlanId: number;

    pppoeUsername: string;
    pppoePassword: string;

    address: string | null;

    localAddress: string | null;
    remoteAddress: string | null;

    cpeBrand: string | null;

    ontSerialNumber:
    string | null;

    detail: string | null;

    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
};

type Props = {
    customer:
    EditCustomerData;

    plans:
    PlanOption[];

    open:
    boolean;

    onOpenChange:
    (
        open: boolean,
    ) => void;
};

export function EditCustomerDialog({
    customer,
    plans,
    open,
    onOpenChange,
}: Props) {
    return (
        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        Edit Customer
                    </DialogTitle>

                    <DialogDescription>
                        Perbarui Customer dan
                        konfigurasi PPPoE.
                    </DialogDescription>
                </DialogHeader>

                {open && (
                    <EditCustomerForm
                        customer={
                            customer
                        }
                        plans={plans}
                        onSuccess={() =>
                            onOpenChange(
                                false,
                            )
                        }
                        onCancel={() =>
                            onOpenChange(
                                false,
                            )
                        }
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function EditCustomerForm({
    customer,
    plans,
    onSuccess,
    onCancel,
}: {
    customer:
    EditCustomerData;

    plans:
    PlanOption[];

    onSuccess:
    () => void;

    onCancel:
    () => void;
}) {
    const [
        state,
        formAction,
        isPending,
    ] = useActionState(
        updateCustomerAction,
        initialUpdateCustomerState,
    );

    const [
        form,
        setForm,
    ] = useState({
        name:
            customer.name,

        phone:
            customer.phone ?? "",

        internetPlanId:
            String(
                customer.internetPlanId,
            ),

        pppoeUsername:
            customer.pppoeUsername,

        pppoePassword:
            customer.pppoePassword,

        address:
            customer.address ?? "",

        localAddress:
            customer.localAddress ??
            "",

        remoteAddress:
            customer.remoteAddress ??
            "",

        cpeBrand:
            customer.cpeBrand ?? "",

        ontSerialNumber:
            customer.ontSerialNumber ??
            "",

        detail:
            customer.detail ?? "",

        status:
            customer.status,
    });

    const availablePlans =
        useMemo(
            () =>
                plans.filter(
                    (plan) =>
                        plan.routerId ===
                        customer.routerId,
                ),
            [
                plans,
                customer.routerId,
            ],
        );

    const selectedPlan =
        availablePlans.find(
            (plan) =>
                String(plan.id) ===
                form.internetPlanId,
        );

    function updateField<
        K extends
        keyof typeof form,
    >(
        field: K,
        value:
            (typeof form)[K],
    ) {
        setForm(
            (current) => ({
                ...current,
                [field]: value,
            }),
        );
    }

    useEffect(() => {
        if (
            state.success !== true
        ) {
            return;
        }

        toast.success(
            "Data berhasil diperbarui",
            {
                description:
                    state.message,
            },
        );

        onSuccess();
    }, [
        state.success,
        state.message,
        onSuccess,
    ]);

    useEffect(() => {
        if (
            state.success ===
            false &&
            state.message
        ) {
            toast.error(
                "Gagal memperbarui Customer",
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
            className="space-y-6"
        >
            <input
                type="hidden"
                name="id"
                value={customer.id}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <p className="font-medium">
                        Data Customer
                    </p>

                    <Field
                        label="Nama Customer"
                        error={
                            state.errors
                                ?.name?.[0]
                        }
                    >
                        <Input
                            name="name"
                            value={form.name}
                            aria-invalid={Boolean(
                                state.errors
                                    ?.name,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "name",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Phone"
                        error={
                            state.errors
                                ?.phone?.[0]
                        }
                    >
                        <Input
                            name="phone"
                            value={
                                form.phone
                            }
                            aria-invalid={Boolean(
                                state.errors
                                    ?.phone,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "phone",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Alamat Customer"
                        error={
                            state.errors
                                ?.address?.[0]
                        }
                    >
                        <Textarea
                            name="address"
                            value={
                                form.address
                            }
                            aria-invalid={Boolean(
                                state.errors
                                    ?.address,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "address",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Merek Router / ONT"
                        error={
                            state.errors
                                ?.cpeBrand?.[0]
                        }
                    >
                        <Input
                            name="cpeBrand"
                            value={
                                form.cpeBrand
                            }
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "cpeBrand",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="SN ONT"
                        error={
                            state.errors
                                ?.ontSerialNumber?.[0]
                        }
                    >
                        <Input
                            name="ontSerialNumber"
                            value={
                                form.ontSerialNumber
                            }
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "ontSerialNumber",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Detail"
                        error={
                            state.errors
                                ?.detail?.[0]
                        }
                    >
                        <Textarea
                            name="detail"
                            value={
                                form.detail
                            }
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "detail",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>
                </div>

                <div className="space-y-4">
                    <p className="font-medium">
                        Internet & PPPoE
                    </p>

                    <Field label="Router">
                        <Input
                            value={
                                customer.routerName
                            }
                            disabled
                        />
                    </Field>

                    <Field
                        label="Paket Internet"
                        error={
                            state.errors
                                ?.internetPlanId?.[0]
                        }
                    >
                        <select
                            name="internetPlanId"
                            value={
                                form.internetPlanId
                            }
                            aria-invalid={Boolean(
                                state.errors
                                    ?.internetPlanId,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "internetPlanId",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm aria-invalid:border-destructive"
                        >
                            {availablePlans.map(
                                (plan) => (
                                    <option
                                        key={
                                            plan.id
                                        }
                                        value={
                                            plan.id
                                        }
                                    >
                                        {
                                            plan.name
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </Field>

                    {selectedPlan && (
                        <div className="grid gap-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-2">
                            <div>
                                <p className="text-muted-foreground">
                                    PPP Profile
                                </p>
                                <p className="font-medium">
                                    {
                                        selectedPlan
                                            .pppProfileName
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">
                                    Bandwidth
                                </p>
                                <p className="font-medium">
                                    Up to{" "}
                                    {
                                        selectedPlan
                                            .bandwidthUpTo
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    <Field
                        label="PPPoE User"
                        error={
                            state.errors
                                ?.pppoeUsername?.[0]
                        }
                    >
                        <Input
                            name="pppoeUsername"
                            value={
                                form.pppoeUsername
                            }
                            aria-invalid={Boolean(
                                state.errors
                                    ?.pppoeUsername,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "pppoeUsername",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="PPPoE Password"
                        error={
                            state.errors
                                ?.pppoePassword?.[0]
                        }
                    >
                        <Input
                            name="pppoePassword"
                            type="text"
                            value={
                                form.pppoePassword
                            }
                            aria-invalid={Boolean(
                                state.errors
                                    ?.pppoePassword,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "pppoePassword",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Local Address"
                        error={
                            state.errors
                                ?.localAddress?.[0]
                        }
                    >
                        <Input
                            name="localAddress"
                            value={
                                form.localAddress
                            }
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "localAddress",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Remote Address"
                        error={
                            state.errors
                                ?.remoteAddress?.[0]
                        }
                    >
                        <Input
                            name="remoteAddress"
                            value={
                                form.remoteAddress
                            }
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "remoteAddress",
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    <Field
                        label="Customer Status"
                        error={
                            state.errors
                                ?.status?.[0]
                        }
                    >
                        <select
                            name="status"
                            value={
                                form.status
                            }
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "status",
                                    event.target
                                        .value as typeof form.status,
                                )
                            }
                            disabled={
                                isPending
                            }
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="ACTIVE">
                                Aktif
                            </option>

                            <option value="SUSPENDED">
                                Suspend
                            </option>

                            <option value="INACTIVE">
                                Nonaktif
                            </option>
                        </select>
                    </Field>
                </div>
            </div>

            {state.success ===
                false &&
                state.message &&
                !state.errors && (
                    <div
                        role="alert"
                        className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        {
                            state.message
                        }
                    </div>
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
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Save />
                    )}

                    {isPending
                        ? "Menyimpan..."
                        : "Simpan Perubahan"}
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children:
    React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>
                {label}
            </Label>

            {children}

            {error && (
                <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                >
                    {error}
                </p>
            )}
        </div>
    );
}