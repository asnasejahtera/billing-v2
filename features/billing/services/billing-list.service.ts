import {
  billingListQuerySchema,
  type BillingListQuery,
} from "../schemas/billing-list.schema";

import {
  listInvoices,
} from "../repositories/invoice.repository";

// ============================================================================
// Types
// ============================================================================

export type BillingDisplayStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "VOID"
  | "OVERDUE";

// ============================================================================
// Local Date Asia/Jakarta
// ============================================================================

function getJakartaDate() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value;

  return `${year}-${month}-${day}`;
}

// ============================================================================
// List Billing
// ============================================================================

export async function listBillingService(
  rawQuery: Record<string, unknown>,
) {
  const parsed =
    billingListQuerySchema.safeParse(
      rawQuery,
    );

  if (!parsed.success) {
    throw new Error(
      "Parameter list billing tidak valid.",
    );
  }

  const query =
    parsed.data;

  const today =
    getJakartaDate();

  const result =
    await listInvoices({
      ...query,
      today,
    });

  const data =
    result.data.map(
      (invoice) => {
        const overdue =
          invoice.status !==
            "PAID" &&
          invoice.status !==
            "VOID" &&
          invoice.dueDate <
            today;

        const displayStatus:
          BillingDisplayStatus =
          overdue
            ? "OVERDUE"
            : invoice.status;

        return {
          ...invoice,
          displayStatus,
          isOverdue: overdue,
        };
      },
    );

  if (query.pageSize === "all") {
    return {
      data,
      page: 1,
      pageSize: "all" as const,
      total: result.total,
      totalPages: 1,
      query: {
        ...query,
        page: 1,
        pageSize: "all" as const,
      },
    };
  }

  const pageSize =
    query.pageSize;

  return {
    data,
    page: query.page,
    pageSize,
    total: result.total,
    totalPages: Math.max(
      1,
      Math.ceil(
        result.total /
          pageSize,
      ),
    ),
    query: {
      ...query,
      pageSize,
    },
  };
}