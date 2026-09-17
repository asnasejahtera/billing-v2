import {
  invoiceInstallmentExportSchema,
} from "@/features/billing/schemas/invoice-installment-export.schema";

import {
  createInvoiceInstallmentExcel,
} from "@/features/billing/services/invoice-installment-export.service";

// ============================================================================
// Runtime
// ============================================================================

export const runtime = "nodejs";

// ============================================================================
// GET
// ============================================================================

export async function GET(
  request: Request,
) {
  const url =
    new URL(request.url);

  const parsed =
    invoiceInstallmentExportSchema.safeParse({
      month:
        url.searchParams.get("month"),
    });

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message:
          parsed.error.issues[0]?.message ??
          "Bulan tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const buffer =
      await createInvoiceInstallmentExcel(
        parsed.data.month,
      );

    const filename =
      `invoice-angsuran-${parsed.data.month}.xlsx`;

    return new Response(
      new Uint8Array(buffer),
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
      "[INVOICE_INSTALLMENT_EXPORT]",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal membuat Excel invoice.",
      },
      {
        status: 500,
      },
    );
  }
}