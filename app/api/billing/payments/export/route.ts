import {
  billingExportSchema,
} from "@/features/billing/schemas/billing-export.schema";

import {
  createBillingExcel,
} from "@/features/billing/services/billing-export.service";

// ============================================================================
// Runtime
// ============================================================================

export const runtime =
  "nodejs";

// ============================================================================
// GET
// ============================================================================

export async function GET(
  request: Request,
) {
  const url =
    new URL(
      request.url,
    );

  const months =
    (
      url.searchParams.get(
        "months",
      ) ?? ""
    )
      .split(",")
      .map(
        (month) =>
          month.trim(),
      )
      .filter(Boolean);

  const parsed =
    billingExportSchema.safeParse({
      months,
    });

  if (!parsed.success) {
    return Response.json(
      {
        success:
          false,
        message:
          parsed.error
            .issues[0]
            ?.message ??
          "Bulan export tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const selectedMonths =
      [
        ...new Set(
          parsed.data
            .months,
        ),
      ].sort();

    const buffer =
      await createBillingExcel(
        selectedMonths,
      );

    const filename =
      `billing-${selectedMonths.join("_")}.xlsx`;

    return new Response(
      new Uint8Array(
        buffer,
      ),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Gagal membuat file Excel.",
      },
      {
        status: 500,
      },
    );
  }
}