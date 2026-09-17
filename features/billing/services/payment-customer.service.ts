import {
  paymentCustomerListSchema,
} from "../schemas/payment-customer-list.schema";
import {
  listPaymentCustomers,
  getPaymentBillingSummary
} from "../repositories/payment-customer.repository";

// ============================================================================
// Payment Customer List
// ============================================================================

export async function listPaymentCustomersService(
    rawQuery: Record<string, unknown>,
  ) {
    const parsed =
      paymentCustomerListSchema.safeParse(
        rawQuery,
      );

    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ??
          "Parameter payment tidak valid.",
      );
    }

    const query =
      parsed.data;

    const today =
      getJakartaDate();

    // ==========================================================================
    // Ambil list + summary secara paralel
    // ==========================================================================

    const [
      result,
      summary,
    ] = await Promise.all([
      listPaymentCustomers({
        ...query,
        today,
      }),

      getPaymentBillingSummary({
        period:
          query.period,
        today,
      }),
    ]);

    // ==========================================================================
    // Semua Data
    // ==========================================================================

    if (
      query.pageSize === "all"
    ) {
      return {
        data:
          result.data,

        summary,

        page: 1,

        pageSize:
          "all" as const,

        total:
          result.total,

        totalPages: 1,

        query: {
          ...query,
          page: 1,
          pageSize:
            "all" as const,
        },
      };
    }

    // ==========================================================================
    // Pagination Normal
    // ==========================================================================

    const pageSize =
      query.pageSize;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          result.total /
            pageSize,
        ),
      );

    return {
      data:
        result.data,

      summary,

      page:
        query.page,

      pageSize,

      total:
        result.total,

      totalPages,

      query: {
        ...query,
        pageSize,
      },
    };
  }

// ============================================================================
// Jakarta Date
// ============================================================================

function getJakartaDate() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Jakarta",
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      },
    ).formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day",
    )?.value;

  return `${year}-${month}-${day}`;
}