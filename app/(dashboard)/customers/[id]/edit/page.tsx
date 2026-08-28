import Link from "next/link";
import {
    ChevronRight,
    UserRound,
} from "lucide-react";
import {
    notFound,
} from "next/navigation";

import {
    EditCustomerForm,
} from "@/features/customers/components/edit-customer-form";

import {
    getCustomerForEditService,
    listCustomerPlanOptionsService,
} from "@/features/customers/services/customer.service";

import {
    listRouterOptionsService,
} from "@/features/routers/services/router.service";

type EditCustomerPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditCustomerPage({
    params,
}: EditCustomerPageProps) {
    const {
        id,
    } = await params;

    const customerId =
        Number(id);

    if (
        !Number.isSafeInteger(
            customerId,
        ) ||
        customerId <= 0
    ) {
        notFound();
    }

    const [
        customer,
        routers,
        plans,
    ] = await Promise.all([
        getCustomerForEditService(
            customerId,
        ),

        listRouterOptionsService(),

        listCustomerPlanOptionsService(),
    ]);

    if (!customer) {
        notFound();
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            {/* BREADCRUMB */}

            <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
            >
                <Link
                    href="/customers?sort=createdAt&order=desc"
                    className="transition-colors hover:text-foreground"
                >
                    Customer
                </Link>

                <ChevronRight className="size-4" />

                <span className="font-medium text-foreground">
                    Edit Customer
                </span>
            </nav>

            {/* HEADER */}

            <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="size-5" />
                </div>

                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Edit Customer
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Perbarui data Customer,
                        Paket Internet dan
                        credential PPPoE.
                    </p>

                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                        {
                            customer.pppoeUsername
                        }
                    </p>
                </div>
            </div>

            {/* FORM */}

            <EditCustomerForm
                customer={{
                    id:
                        customer.id,

                    name:
                        customer.name,

                    phone:
                        customer.phone,

                    routerId:
                        customer.routerId,

                    internetPlanId:
                        customer.internetPlanId,

                    pppoeUsername:
                        customer.pppoeUsername,

                    pppoePassword:
                        customer.pppoePassword,

                    address:
                        customer.address,

                    localAddress:
                        customer.localAddress,

                    remoteAddress:
                        customer.remoteAddress,

                    cpeBrand:
                        customer.cpeBrand,

                    ontSerialNumber:
                        customer.ontSerialNumber,

                    detail:
                        customer.detail,

                    status:
                        customer.status,
                }}
                routers={routers}
                plans={plans}
            />
        </div>
    );
}