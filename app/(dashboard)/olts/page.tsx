import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateOltDialog } from "@/features/olts/components/create-olt-dialog";
import { listOltsService } from "@/features/olts/services/olt.service";
import { OltRowActions } from "@/features/olts/components/olt-row-actions";

type Props = {
    searchParams: Promise<{
        q?: string;
        status?: string;
        sort?: string;
        order?: string;
        page?: string;
        pageSize?: string;
    }>;
};

export default async function OltsPage({ searchParams }: Props) {
    const params = await searchParams;
    const result = await listOltsService(params);
    const { query } = result;

    function buildUrl(values: Partial<typeof query> = {}) {
        const next = { ...query, ...values };
        const search = new URLSearchParams();

        if (next.q) search.set("q", next.q);
        if (next.status !== "all") search.set("status", next.status);
        search.set("sort", next.sort);
        search.set("order", next.order);
        search.set("page", String(next.page));
        search.set("pageSize", String(next.pageSize));

        return `/network/olts?${search.toString()}`;
    }

    function sortUrl(sort: typeof query.sort) {
        const order = query.sort === sort && query.order === "asc" ? "desc" : "asc";
        return buildUrl({ sort, order, page: 1 });
    }

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            {/* =========================
       * HEADER
       * ========================= */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">OLT</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola perangkat OLT dan physical PON port.
                    </p>
                </div>
                <CreateOltDialog />
            </div>

            {/* =========================
       * FILTER
       * ========================= */}
            <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_120px_auto]" method="get">
                <Input
                    name="q"
                    defaultValue={query.q}
                    placeholder="Cari nama, brand atau model..."
                />

                <select
                    name="status"
                    defaultValue={query.status}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                    <option value="all">Semua status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak aktif</option>
                </select>

                <select
                    name="pageSize"
                    defaultValue={String(query.pageSize)}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                    <option value="10">10 / page</option>
                    <option value="20">20 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                </select>

                <input type="hidden" name="sort" value={query.sort} />
                <input type="hidden" name="order" value={query.order} />

                <Button type="submit">
                    <Search className="size-4" />
                    Cari
                </Button>
            </form>

            {/* =========================
       * EMPTY
       * ========================= */}
            {result.data.length === 0 ? (
                <div className="rounded-lg border p-10 text-center">
                    <p className="font-medium">Belum ada OLT</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tambahkan OLT agar dapat dipilih pada topology map.
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop */}
                    <div className="hidden overflow-hidden rounded-lg border md:block">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3">
                                        <Link href={sortUrl("name")} className="hover:underline">
                                            Nama
                                        </Link>
                                    </th>
                                    <th className="px-4 py-3">Brand / Model</th>
                                    <th className="px-4 py-3">
                                        <Link href={sortUrl("ponCount")} className="hover:underline">
                                            PON
                                        </Link>
                                    </th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">
                                        <Link href={sortUrl("createdAt")} className="hover:underline">
                                            Dibuat
                                        </Link>
                                    </th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {result.data.map((olt) => (
                                    <tr key={olt.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{olt.name}</td>
                                        <td className="px-4 py-3">
                                            {[olt.brand, olt.model].filter(Boolean).join(" · ") || "-"}
                                        </td>
                                        <td className="px-4 py-3">{olt.ponCount}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${olt.isActive
                                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                                : "bg-muted text-muted-foreground"
                                                }`}>
                                                {olt.isActive ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {olt.createdAt.toLocaleDateString("id-ID")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <OltRowActions olt={{ id: olt.id, name: olt.name }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="space-y-2 md:hidden">
                        {result.data.map((olt) => (
                            <div key={olt.id} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{olt.name}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {[olt.brand, olt.model].filter(Boolean).join(" · ") || "-"}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium">
                                        {olt.isActive ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                                <div className="mt-3 text-sm">
                                    <span className="text-muted-foreground">PON </span>
                                    <span className="font-medium">{olt.ponCount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* =========================
       * PAGINATION
       * ========================= */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    {result.total} OLT · Halaman {result.page} dari {result.totalPages}
                </p>

                <div className="flex gap-2">
                    {result.page > 1 ? (
                        <Link
                            href={buildUrl({ page: result.page - 1 })}
                            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted"
                        >
                            <ChevronLeft className="size-4" />
                            Sebelumnya
                        </Link>
                    ) : (
                        <span className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border px-3 text-sm opacity-50">
                            <ChevronLeft className="size-4" />
                            Sebelumnya
                        </span>
                    )}

                    {result.page < result.totalPages ? (
                        <Link
                            href={buildUrl({ page: result.page + 1 })}
                            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted"
                        >
                            Berikutnya
                            <ChevronRight className="size-4" />
                        </Link>
                    ) : (
                        <span className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border px-3 text-sm opacity-50">
                            Berikutnya
                            <ChevronRight className="size-4" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}