"use client";

import Link from "next/link";
import {
    useActionState,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    Loader2,
    Save,
} from "lucide-react";
import { toast } from "sonner";

import { updateCustomerAction } from "@/features/customers/actions/update-customer.action";
import { initialUpdateCustomerState } from "@/features/customers/types/update-customer-action-state";

import {
    Button,
    buttonVariants,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RouterOption = {
    id: number;
    name: string;
    host: string;
};

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
    internetPlanId: number;
    pppoeUsername: string;
    pppoePassword: string;
    address: string | null;
    localAddress: string | null;
    remoteAddress: string | null;
    cpeBrand: string | null;
    ontSerialNumber: string | null;
    detail: string | null;
    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
};

type CustomerFormValues = {
    name: string;
    phone: string;
    routerId: string;
    internetPlanId: string;
    pppoeUsername: string;
    pppoePassword: string;
    address: string;
    localAddress: string;
    remoteAddress: string;
    cpeBrand: string;
    ontSerialNumber: string;
    detail: string;
    status:
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
};

type Props = {
    customer: EditCustomerData;
    routers: RouterOption[];
    plans: PlanOption[];
};

export function EditCustomerForm({
    customer,
    routers,
    plans,
}: Props) {
    const [
        form,
        setForm,
    ] = useState<CustomerFormValues>({
        name: customer.name,
        phone: customer.phone ?? "",
        routerId: String(
            customer.routerId,
        ),
        internetPlanId: String(
            customer.internetPlanId,
        ),
        pppoeUsername:
            customer.pppoeUsername,
        pppoePassword:
            customer.pppoePassword,
        address:
            customer.address ?? "",
        localAddress:
            customer.localAddress ?? "",
        remoteAddress:
            customer.remoteAddress ?? "",
        cpeBrand:
            customer.cpeBrand ?? "",
        ontSerialNumber:
            customer.ontSerialNumber ?? "",
        detail:
            customer.detail ?? "",
        status:
            customer.status,
    });

    const [
        state,
        formAction,
        isPending,
    ] = useActionState(
        updateCustomerAction,
        initialUpdateCustomerState,
    );

    const availablePlans =
        useMemo(
            () =>
                plans.filter(
                    (plan) =>
                        String(
                            plan.routerId,
                        ) ===
                        form.routerId,
                ),
            [
                plans,
                form.routerId,
            ],
        );

    const selectedPlan =
        availablePlans.find(
            (plan) =>
                String(plan.id) ===
                form.internetPlanId,
        );

    const selectedRouter =
        routers.find(
            (router) =>
                String(router.id) ===
                form.routerId,
        );

    useEffect(() => {
        if (
            state.success === false &&
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

    function updateField<
        K extends keyof CustomerFormValues,
    >(
        field: K,
        value: CustomerFormValues[K],
    ) {
        setForm(
            (current) => ({
                ...current,
                [field]: value,
            }),
        );
    }

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

            {/*
             * Status tidak diubah dari Edit.
             *
             * Suspend / Buka Isolir menggunakan
             * action khusus supaya profile MikroTik
             * tetap konsisten.
             */}
            <input
                type="hidden"
                name="status"
                value={form.status}
            />

            <div className="grid gap-6 rounded-lg border bg-background p-4 sm:p-6 lg:grid-cols-2">
                {/* ================================= */}
                {/* DATA CUSTOMER */}
                {/* ================================= */}

                <section className="space-y-4">
                    <div>
                        <h2 className="font-semibold">
                            Data Customer
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Informasi utama pelanggan.
                        </p>
                    </div>

                    <Field
                        label="Nama Customer"
                        error={
                            state.errors
                                ?.name?.[0]
                        }
                    >
                        <Input
                            name="name"
                            value={
                                form.name
                            }
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
                            placeholder="Nama customer"
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
                            placeholder="08xxxxxxxxxx"
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
                            placeholder="Alamat customer"
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
                            aria-invalid={Boolean(
                                state.errors
                                    ?.cpeBrand,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "cpeBrand",
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Huawei, ZTE..."
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
                            aria-invalid={Boolean(
                                state.errors
                                    ?.ontSerialNumber,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "ontSerialNumber",
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Serial number"
                            disabled={
                                isPending
                            }
                        />
                    </Field>
                </section>

                {/* ================================= */}
                {/* INTERNET & PPPOE */}
                {/* ================================= */}

                <section className="space-y-4">
                    <div>
                        <h2 className="font-semibold">
                            Internet & PPPoE
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Router, paket dan
                            credential PPPoE.
                        </p>
                    </div>

                    {/* ROUTER READONLY */}

                    <Field label="Router">
                        <select
                            value={
                                form.routerId
                            }
                            disabled
                            className="h-9 w-full cursor-not-allowed rounded-md border bg-muted px-3 text-sm text-muted-foreground"
                        >
                            {selectedRouter ? (
                                <option
                                    value={
                                        selectedRouter.id
                                    }
                                >
                                    {
                                        selectedRouter.name
                                    }{" "}
                                    ·{" "}
                                    {
                                        selectedRouter.host
                                    }
                                </option>
                            ) : (
                                <option>
                                    Router tidak ditemukan
                                </option>
                            )}
                        </select>

                        <p className="text-xs text-muted-foreground">
                            Router tidak dapat
                            dipindahkan melalui
                            Edit Customer.
                        </p>
                    </Field>

                    {/* INTERNET PLAN */}

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
                                isPending ||
                                availablePlans.length ===
                                0
                            }
                            className={cn(
                                "h-9 w-full rounded-md border bg-background px-3 text-sm",
                                state.errors
                                    ?.internetPlanId &&
                                "border-destructive ring-destructive/20",
                            )}
                        >
                            <option value="">
                                Pilih Paket Internet
                            </option>

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

                    {/* PLAN PREVIEW */}

                    {selectedPlan && (
                        <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-2">
                            <div>
                                <p className="text-muted-foreground">
                                    PPP Profile
                                </p>

                                <p className="font-medium">
                                    {
                                        selectedPlan.pppProfileName
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
                                        selectedPlan.bandwidthUpTo
                                    }
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="text-muted-foreground">
                                    Harga
                                </p>

                                <p className="font-medium">
                                    {formatCurrency(
                                        selectedPlan.price,
                                    )}
                                </p>
                            </div>

                            {form.status ===
                                "SUSPENDED" && (
                                    <div className="sm:col-span-2">
                                        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                                            Customer sedang
                                            diisolir. Perubahan
                                            Paket disimpan sebagai
                                            profile yang akan
                                            digunakan saat Buka
                                            Isolir.
                                        </p>
                                    </div>
                                )}
                        </div>
                    )}

                    {/* USER */}

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
                            autoComplete="off"
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    {/* PASSWORD */}

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
                            autoComplete="off"
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    {/* LOCAL ADDRESS */}

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
                            aria-invalid={Boolean(
                                state.errors
                                    ?.localAddress,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "localAddress",
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Optional"
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    {/* REMOTE ADDRESS */}

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
                            aria-invalid={Boolean(
                                state.errors
                                    ?.remoteAddress,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "remoteAddress",
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Optional"
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    {/* DETAIL */}

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
                            aria-invalid={Boolean(
                                state.errors
                                    ?.detail,
                            )}
                            onChange={(
                                event,
                            ) =>
                                updateField(
                                    "detail",
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Catatan tambahan"
                            disabled={
                                isPending
                            }
                        />
                    </Field>

                    {/* STATUS */}

                    <Field label="Customer Status">
                        <select
                            value={
                                form.status
                            }
                            disabled
                            className="h-9 w-full cursor-not-allowed rounded-md border bg-muted px-3 text-sm text-muted-foreground"
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

                        <p className="text-xs text-muted-foreground">
                            Gunakan aksi Isolir /
                            Buka Isolir untuk
                            mengubah status Suspend.
                        </p>
                    </Field>
                </section>
            </div>

            {/* SERVER ERROR */}

            {state.success ===
                false &&
                state.message && (
                    <div
                        role="alert"
                        className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        {
                            state.message
                        }
                    </div>
                )}

            {/* ACTION */}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Link
                    href="/customers?sort=createdAt&order=desc"
                    className={buttonVariants({
                        variant:
                            "outline",
                    })}
                >
                    Batal
                </Link>

                <Button
                    type="submit"
                    disabled={
                        isPending ||
                        !form.internetPlanId
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
    children: ReactNode;
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
                    className="text-xs text-destructive"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

function formatCurrency(
    value: string,
) {
    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        },
    ).format(
        Number(value) || 0,
    );
}