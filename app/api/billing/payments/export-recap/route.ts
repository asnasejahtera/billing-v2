import {
  paymentRecapExportSchema,
} from "@/features/billing/schemas/payment-recap-export.schema";

import {
  createPaymentRecapExcel,
} from "@/features/billing/services/payment-recap-export.service";

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
        (value) =>
          value.trim(),
      )
      .filter(Boolean);

  const parsed =
    paymentRecapExportSchema.safeParse({
      months,
    });

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message:
          parsed.error
            .issues[0]
            ?.message ??
          "Bulan tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const selected =
      [
        ...new Set(
          parsed.data.months,
        ),
      ].sort();

    const buffer =
      await createPaymentRecapExcel(
        selected,
      );

    const filename =
      `rekap-pembayaran-${selected.join("_")}.xlsx`;

    return new Response(
      new Uint8Array(
        buffer,
      ),
      {
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
    console.error(
      "[PAYMENT_RECAP_EXPORT]",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal membuat rekap Excel.",
      },
      {
        status: 500,
      },
    );
  }
}