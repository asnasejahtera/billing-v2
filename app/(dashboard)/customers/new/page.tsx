import Link from "next/link";
import {
    ChevronRight,
    Users,
} from "lucide-react";
import { CreateCustomerForm } from "@/features/customers/components/create-customer-form";
import { listCustomerPlanOptionsService } from "@/features/customers/services/customer.service";
import { listRouterOptionsService } from "@/features/routers/services/router.service";

export default async function NewCustomerPage() {
    const [routers, plans] =
        await Promise.all([
            listRouterOptionsService(),
            listCustomerPlanOptionsService(),
        ]);

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                <Link
                    href="/customers"
                    className="hover:text-foreground"
                >
                    Customer
                </Link>

                <ChevronRight className="size-4" />

                <span className="text-foreground">
                    Tambah
                </span>
            </nav>

            <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Users className="size-5" />
                </div>

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Tambah Customer
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Tambahkan Customer baru ke database billing.
                    </p>
                </div>
            </div>

            <CreateCustomerForm
                routers={routers}
                plans={plans}
            />
        </div>
    );
}