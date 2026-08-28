import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ChevronRight,
    Router,
} from "lucide-react";
import { RouterMonitoring } from "@/features/routers/components/router-monitoring";
import { getRouterDetailService } from "@/features/routers/services/router.service";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { EditRouterDialog } from "@/features/routers/components/edit-router-dialog";

type RouterDetailPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function RouterDetailPage({
    params,
}: RouterDetailPageProps) {
    const { id: idParam } =
        await params;

    const id = Number(idParam);

    if (
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {
        notFound();
    }

    const router =
        await getRouterDetailService(id);

    if (!router) {
        notFound();
    }

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-sm text-muted-foreground"
            >
                <Link
                    href="/routers"
                    className="hover:text-foreground"
                >
                    Router
                </Link>

                <ChevronRight className="size-4" />

                <span className="truncate text-foreground">
                    {router.name}
                </span>
            </nav>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Router className="size-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                                {router.name}
                            </h1>

                            {router.isActive ? (
                                <Badge>Aktif</Badge>
                            ) : (
                                <Badge variant="secondary">
                                    Nonaktif
                                </Badge>
                            )}
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Monitoring resource dan traffic MikroTik.
                        </p>
                    </div>
                </div>

                <EditRouterDialog
                    router={{
                        id: router.id,
                        name: router.name,
                        host: router.host,
                        port: router.port,
                        username: router.username,
                        useHttps: router.useHttps,
                        description: router.description,
                    }}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Informasi Router
                    </CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Info
                        label="Host"
                        value={`${router.host}:${router.port}`}
                    />

                    <Info
                        label="Username"
                        value={router.username}
                    />

                    <Info
                        label="Connection"
                        value={
                            router.useHttps
                                ? "RouterOS API TLS"
                                : "RouterOS API"
                        }
                    />

                    <Info
                        label="Deskripsi"
                        value={
                            router.description ?? "-"
                        }
                    />
                </CardContent>
            </Card>

            <RouterMonitoring
                routerId={router.id}
                isActive={router.isActive}
            />
        </div>
    );
}

function Info({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 truncate text-sm font-medium">
                {value}
            </p>
        </div>
    );
}