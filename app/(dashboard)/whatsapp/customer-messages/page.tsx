import {
    ArrowDown,
    ArrowUp,
    Search,
} from "lucide-react";

import Link from "next/link";
import {
    redirect,
} from "next/navigation";

import {
    buttonVariants,
} from "@/components/ui/button";

import {
    Input,
} from "@/components/ui/input";

import {
    CustomerMessageTable,
} from "@/features/whatsapp/components/customer-message/customer-message-table";

import {
    getCustomerMessagePageService,
} from "@/features/whatsapp/services/customer-message.service";

import {
    listWhatsAppTemplatesService,
} from "@/features/whatsapp/services/whatsapp-template.service";
// import {
//     getCurrentUser,
// } from "@/lib/auth/get-current-user";

/**
 * ============================================
 * PROPS
 * ============================================
 */
type Props = {
    searchParams: Promise<{
        q?: string;
        page?: string;
        pageSize?: string;
        sort?: string;
        order?: string;

        oltId?: string;
        odcId?: string;
        odpId?: string;
    }>;
};

/**
 * ============================================
 * PAGE
 * ============================================
 */
export default async function CustomerMessagesPage({
    searchParams,
}: Props) {
    // const user =
    //     await getCurrentUser();

    // if (!user) {
    //     redirect(
    //         "/login",
    //     );
    // }

    const params =
        await searchParams;

    /**
     * ========================================
     * LOAD
     * ========================================
     */
    const [
        result,
        templateRows,
    ] =
        await Promise.all([
            getCustomerMessagePageService({
                q:
                    params.q,
                page:
                    params.page,
                pageSize:
                    params.pageSize,
                sort:
                    params.sort,
                order:
                    params.order,
                oltId:
                    params.oltId,
                odcId:
                    params.odcId,
                odpId:
                    params.odpId,
            }),

            listWhatsAppTemplatesService(),
        ]);

    const templates =
        templateRows
            .filter(
                (template) =>
                    template.isActive,
            )
            .map(
                (template) => ({
                    id:
                        template.id,
                    name:
                        template.name,
                    body:
                        template.body,
                }),
            );

    /**
     * ========================================
     * BUILD URL
     * ========================================
     */
    function buildUrl(
        values: Record<
            string,
            string | number | undefined
        >,
    ) {
        const query =
            new URLSearchParams();

        const merged = {
            q:
                params.q,

            page:
                result.page,

            pageSize:
                result.pageSize,

            sort:
                params.sort ??
                "name",

            order:
                params.order ??
                "asc",

            oltId:
                result.filters
                    .oltId ??
                undefined,

            odcId:
                result.filters
                    .odcId ??
                undefined,

            odpId:
                result.filters
                    .odpId ??
                undefined,

            ...values,
        };

        for (
            const [
                key,
                value,
            ] of Object.entries(
                merged,
            )
        ) {
            if (
                value ===
                undefined ||
                value ===
                ""
            ) {
                continue;
            }

            query.set(
                key,
                String(value),
            );
        }

        return `/whatsapp/customer-messages?${query.toString()}`;
    }

    /**
     * ========================================
     * SORT URL
     * ========================================
     */
    function sortUrl(
        column: string,
    ) {
        const active =
            (
                params.sort ??
                "name"
            ) ===
            column;

        const nextOrder =
            active &&
                (
                    params.order ??
                    "asc"
                ) ===
                "asc"
                ? "desc"
                : "asc";

        return buildUrl({
            page:
                1,
            sort:
                column,
            order:
                nextOrder,
        });
    }

    /**
     * ========================================
     * SORT ICON
     * ========================================
     */
    function SortIcon({
        column,
    }: {
        column: string;
    }) {
        const active =
            (
                params.sort ??
                "name"
            ) ===
            column;

        if (!active) {
            return null;
        }

        return (
            params.order ??
            "asc"
        ) ===
            "desc" ? (
            <ArrowDown className="size-3" />
        ) : (
            <ArrowUp className="size-3" />
        );
    }

    return (
        <div className="space-y-4">
            {/* ======================================
          INTRO
      ====================================== */}
            <div>
                <h2 className="text-lg font-semibold">
                    Customer Message
                </h2>

                <p className="text-sm text-muted-foreground">
                    Filter jaringan lalu pilih customer yang akan menerima pesan WhatsApp.
                </p>
            </div>

            {/* ======================================
          FILTER
      ====================================== */}
            <form
                method="GET"
                className="space-y-3 rounded-lg border p-4"
            >
                {/* ==================================
            TOPOLOGY FILTER
        ================================== */}
                <div className="grid gap-3 md:grid-cols-3">
                    {/* ================================
              OLT
          ================================ */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium">
                            OLT
                        </label>

                        <select
                            name="oltId"
                            defaultValue={
                                result.filters
                                    .oltId ??
                                ""
                            }
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">
                                All
                            </option>

                            {result.filters.olts.map(
                                (
                                    node,
                                ) => (
                                    <option
                                        key={
                                            node.id
                                        }
                                        value={
                                            node.id
                                        }
                                    >
                                        {node.code} · {node.name}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    {/* ================================
              ODC
          ================================ */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium">
                            ODC
                        </label>

                        <select
                            name="odcId"
                            defaultValue={
                                result.filters
                                    .odcId ??
                                ""
                            }
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">
                                All
                            </option>

                            {result.filters.odcs.map(
                                (
                                    node,
                                ) => (
                                    <option
                                        key={
                                            node.id
                                        }
                                        value={
                                            node.id
                                        }
                                    >
                                        {node.code} · {node.name}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    {/* ================================
              ODP
          ================================ */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium">
                            ODP
                        </label>

                        <select
                            name="odpId"
                            defaultValue={
                                result.filters
                                    .odpId ??
                                ""
                            }
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">
                                All
                            </option>

                            {result.filters.odps.map(
                                (
                                    node,
                                ) => (
                                    <option
                                        key={
                                            node.id
                                        }
                                        value={
                                            node.id
                                        }
                                    >
                                        {node.code} · {node.name}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </div>

                {/* ==================================
            SEARCH + PAGE SIZE
        ================================== */}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            name="q"
                            defaultValue={
                                params.q ??
                                ""
                            }
                            placeholder="Cari nama atau nomor customer..."
                            className="pl-9"
                        />
                    </div>

                    <select
                        name="pageSize"
                        defaultValue={
                            String(
                                result.pageSize,
                            )
                        }
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="10">
                            10 / halaman
                        </option>

                        <option value="20">
                            20 / halaman
                        </option>

                        <option value="50">
                            50 / halaman
                        </option>

                        <option value="100">
                            100 / halaman
                        </option>

                        <option value="all">
                            All / halaman
                        </option>
                    </select>

                    <button
                        type="submit"
                        className={
                            buttonVariants()
                        }
                    >
                        Terapkan Filter
                    </button>
                </div>

                {/* ==================================
            PRESERVE SORT
        ================================== */}
                <input
                    type="hidden"
                    name="sort"
                    value={
                        params.sort ??
                        "name"
                    }
                />

                <input
                    type="hidden"
                    name="order"
                    value={
                        params.order ??
                        "asc"
                    }
                />
            </form>

            {/* ======================================
          ACTIVE FILTER
      ====================================== */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>
                    OLT:{" "}
                    {result.filters
                        .oltId
                        ? result.filters.olts.find(
                            (
                                node,
                            ) =>
                                node.id ===
                                result.filters
                                    .oltId,
                        )?.code ??
                        "-"
                        : "All"}
                </span>

                <span>·</span>

                <span>
                    ODC:{" "}
                    {result.filters
                        .odcId
                        ? result.filters.odcs.find(
                            (
                                node,
                            ) =>
                                node.id ===
                                result.filters
                                    .odcId,
                        )?.code ??
                        "-"
                        : "All"}
                </span>

                <span>·</span>

                <span>
                    ODP:{" "}
                    {result.filters
                        .odpId
                        ? result.filters.odps.find(
                            (
                                node,
                            ) =>
                                node.id ===
                                result.filters
                                    .odpId,
                        )?.code ??
                        "-"
                        : "All"}
                </span>
            </div>

            {/* ======================================
          SORT
      ====================================== */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                    Urutkan:
                </span>

                <Link
                    href={
                        sortUrl(
                            "name",
                        )
                    }
                    className={buttonVariants({
                        variant:
                            "outline",
                        size:
                            "sm",
                    })}
                >
                    Nama
                    <SortIcon column="name" />
                </Link>

                <Link
                    href={
                        sortUrl(
                            "phone",
                        )
                    }
                    className={buttonVariants({
                        variant:
                            "outline",
                        size:
                            "sm",
                    })}
                >
                    Nomor
                    <SortIcon column="phone" />
                </Link>

                <Link
                    href={
                        sortUrl(
                            "status",
                        )
                    }
                    className={buttonVariants({
                        variant:
                            "outline",
                        size:
                            "sm",
                    })}
                >
                    Status
                    <SortIcon column="status" />
                </Link>
            </div>

            {/* ======================================
          SUMMARY
      ====================================== */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    {result.total} customer ditemukan
                </p>

                <p className="text-xs text-muted-foreground">
                    {result.pageSize ===
                        "all"
                        ? "Menampilkan semua customer"
                        : `${result.pageSize} customer / halaman`}
                </p>
            </div>

            {/* ======================================
          TABLE
      ====================================== */}
            <CustomerMessageTable
                customers={
                    result.data
                }
                templates={
                    templates
                }
            />
            {/* ======================================
          PAGINATION
      ====================================== */}
            {result.pageSize !==
                "all" && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Halaman {result.page} dari {result.totalPages}
                        </p>

                        <div className="flex gap-2">
                            {result.page >
                                1 && (
                                    <Link
                                        href={
                                            buildUrl({
                                                page:
                                                    result.page -
                                                    1,
                                            })
                                        }
                                        className={buttonVariants({
                                            variant:
                                                "outline",
                                            size:
                                                "sm",
                                        })}
                                    >
                                        Sebelumnya
                                    </Link>
                                )}

                            {result.page <
                                result.totalPages && (
                                    <Link
                                        href={
                                            buildUrl({
                                                page:
                                                    result.page +
                                                    1,
                                            })
                                        }
                                        className={buttonVariants({
                                            variant:
                                                "outline",
                                            size:
                                                "sm",
                                        })}
                                    >
                                        Berikutnya
                                    </Link>
                                )}
                        </div>
                    </div>
                )}
        </div>
    );
}