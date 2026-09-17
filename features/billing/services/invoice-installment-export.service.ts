import ExcelJS from "exceljs";

import {
  listInvoicesForInstallmentExport,
  listPaymentsForInstallmentExport,
} from "../repositories/invoice-installment-export.repository";

// ============================================================================
// Helpers
// ============================================================================

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getMonthLabel(month: string) {
  const [year, value] = month.split("-").map(Number);

  const label = new Intl.DateTimeFormat(
    "id-ID",
    {
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(year, value - 1, 1),
  );

  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ============================================================================
// Excel
// ============================================================================

export async function createInvoiceInstallmentExcel(
  month: string,
) {
  const invoices =
    await listInvoicesForInstallmentExport(month);

  const payments =
    await listPaymentsForInstallmentExport(
      invoices.map((invoice) => invoice.id),
    );

  // ==========================================================================
  // Payment per Invoice
  // ==========================================================================

  const paymentMap = new Map<
    number,
    typeof payments
  >();

  for (const payment of payments) {
    const current =
      paymentMap.get(payment.invoiceId) ?? [];

    current.push(payment);

    paymentMap.set(
      payment.invoiceId,
      current,
    );
  }

  // ==========================================================================
  // Dynamic Installment Count
  // Minimal ANGSURAN 1 walaupun belum ada pembayaran.
  // ==========================================================================

  const maxInstallments = Math.max(
    1,
    ...invoices.map(
      (invoice) =>
        paymentMap.get(invoice.id)?.length ?? 0,
    ),
  );

  // ==========================================================================
  // Workbook
  // ==========================================================================

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Billing MikroTik";

  workbook.created =
    new Date();

  const worksheet =
    workbook.addWorksheet(
      "Invoice Angsuran",
      {
        views: [
          {
            state: "frozen",
            ySplit: 2,
            xSplit: 4,
          },
        ],
      },
    );

  // ==========================================================================
  // Column Positions
  // ==========================================================================

  const installmentStartColumn = 5;

  const totalInvoiceColumn =
    installmentStartColumn +
    maxInstallments * 2;

  const paidColumn =
    totalInvoiceColumn + 1;

  const outstandingColumn =
    totalInvoiceColumn + 2;

  const statusColumn =
    totalInvoiceColumn + 3;

  // ==========================================================================
  // Static Headers
  // ==========================================================================

  worksheet.mergeCells("A1:A2");
  worksheet.mergeCells("B1:B2");
  worksheet.mergeCells("C1:C2");
  worksheet.mergeCells("D1:D2");

  worksheet.getCell("A1").value = "NO";
  worksheet.getCell("B1").value = "NAMA";
  worksheet.getCell("C1").value = "NOMER INVOICE";
  worksheet.getCell("D1").value = "BULAN";

  // ==========================================================================
  // Dynamic ANGSURAN Header
  // ==========================================================================

  for (
    let index = 0;
    index < maxInstallments;
    index++
  ) {
    const start =
      installmentStartColumn +
      index * 2;

    worksheet.mergeCells(
      1,
      start,
      1,
      start + 1,
    );

    worksheet.getCell(
      1,
      start,
    ).value =
      `ANGSURAN ${index + 1}`;

    worksheet.getCell(
      2,
      start,
    ).value =
      "TANGGAL BAYAR";

    worksheet.getCell(
      2,
      start + 1,
    ).value =
      "METODE";
  }

  // ==========================================================================
  // Total Headers
  // ==========================================================================

  worksheet.mergeCells(
    1,
    totalInvoiceColumn,
    2,
    totalInvoiceColumn,
  );

  worksheet.mergeCells(
    1,
    paidColumn,
    2,
    paidColumn,
  );

  worksheet.mergeCells(
    1,
    outstandingColumn,
    2,
    outstandingColumn,
  );

  worksheet.mergeCells(
    1,
    statusColumn,
    2,
    statusColumn,
  );

  worksheet.getCell(
    1,
    totalInvoiceColumn,
  ).value = "TOTAL TAGIHAN";

  worksheet.getCell(
    1,
    paidColumn,
  ).value = "DIBAYAR";

  worksheet.getCell(
    1,
    outstandingColumn,
  ).value = "KURANG BAYAR";

  worksheet.getCell(
    1,
    statusColumn,
  ).value = "KETERANGAN";

  // ==========================================================================
  // Header Styling
  // ==========================================================================

  const lastColumn =
    statusColumn;

  for (
    let row = 1;
    row <= 2;
    row++
  ) {
    for (
      let column = 1;
      column <= lastColumn;
      column++
    ) {
      const cell =
        worksheet.getCell(row, column);

      cell.font = {
        bold: true,
      };

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  // ==========================================================================
  // Yellow Header: NO + NAMA
  // ==========================================================================

  for (const address of [
    "A1",
    "B1",
  ]) {
    worksheet.getCell(address).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFFFF00",
      },
    };

    worksheet.getCell(address).font = {
      bold: true,
      italic: true,
    };
  }

  // ==========================================================================
  // Installment Subheaders
  // ==========================================================================

  for (
    let index = 0;
    index < maxInstallments;
    index++
  ) {
    const start =
      installmentStartColumn +
      index * 2;

    // Tanggal bayar -> kuning
    worksheet.getCell(
      2,
      start,
    ).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFFFF00",
      },
    };

    worksheet.getCell(
      2,
      start,
    ).font = {
      bold: true,
      italic: true,
    };

    // Metode -> abu
    worksheet.getCell(
      2,
      start + 1,
    ).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFD9D9D9",
      },
    };

    worksheet.getCell(
      2,
      start + 1,
    ).font = {
      bold: true,
      italic: true,
    };
  }

  // ==========================================================================
  // Data
  // ==========================================================================

  const monthLabel =
    getMonthLabel(month);

  invoices.forEach(
    (invoice, invoiceIndex) => {
      const row =
        invoiceIndex + 3;

      const invoicePayments =
        paymentMap.get(invoice.id) ?? [];

      const totalInvoice =
        Number(invoice.total);

      const totalPaid =
        invoicePayments.reduce(
          (total, payment) =>
            total +
            Number(payment.amount),
          0,
        );

      const outstanding =
        Math.max(
          totalInvoice - totalPaid,
          0,
        );

      const status =
        outstanding <= 0
          ? "LUNAS"
          : "BELUM LUNAS";

      // ----------------------------------------------------------------------
      // Static Data
      // ----------------------------------------------------------------------

      worksheet.getCell(
        row,
        1,
      ).value =
        invoiceIndex + 1;

      worksheet.getCell(
        row,
        2,
      ).value =
        invoice.customerName;

      worksheet.getCell(
        row,
        3,
      ).value =
        invoice.invoiceNumber;

      worksheet.getCell(
        row,
        4,
      ).value =
        monthLabel;

      // ----------------------------------------------------------------------
      // Installments
      // ----------------------------------------------------------------------

      for (
        let installmentIndex = 0;
        installmentIndex < maxInstallments;
        installmentIndex++
      ) {
        const start =
          installmentStartColumn +
          installmentIndex * 2;

        const payment =
          invoicePayments[
            installmentIndex
          ];

        worksheet.getCell(
          row,
          start,
        ).value =
          payment
            ? formatDate(
                payment.paymentDate,
              )
            : "";

        worksheet.getCell(
          row,
          start + 1,
        ).value =
          payment?.method ?? "";
      }

      // ----------------------------------------------------------------------
      // Totals
      // ----------------------------------------------------------------------

      worksheet.getCell(
        row,
        totalInvoiceColumn,
      ).value =
        totalInvoice;

      worksheet.getCell(
        row,
        paidColumn,
      ).value =
        totalPaid;

      worksheet.getCell(
        row,
        outstandingColumn,
      ).value =
        outstanding;

      worksheet.getCell(
        row,
        statusColumn,
      ).value =
        status;

      // ----------------------------------------------------------------------
      // Currency Format
      // ----------------------------------------------------------------------

      for (const column of [
        totalInvoiceColumn,
        paidColumn,
        outstandingColumn,
      ]) {
        worksheet.getCell(
          row,
          column,
        ).numFmt =
          '"Rp" #,##0';
      }

      // ----------------------------------------------------------------------
      // Status Styling
      // ----------------------------------------------------------------------

      const statusCell =
        worksheet.getCell(
          row,
          statusColumn,
        );

      statusCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      if (
        status === "LUNAS"
      ) {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFC6EFCE",
          },
        };

        statusCell.font = {
          bold: true,
          color: {
            argb: "FF006100",
          },
        };
      } else {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFFFC7CE",
          },
        };

        statusCell.font = {
          bold: true,
          color: {
            argb: "FF9C0006",
          },
        };
      }

      // ----------------------------------------------------------------------
      // Row Border
      // ----------------------------------------------------------------------

      for (
        let column = 1;
        column <= lastColumn;
        column++
      ) {
        const cell =
          worksheet.getCell(
            row,
            column,
          );

        cell.border = {
          top: {
            style: "thin",
          },
          left: {
            style: "thin",
          },
          bottom: {
            style: "thin",
          },
          right: {
            style: "thin",
          },
        };

        cell.alignment = {
          ...cell.alignment,
          vertical: "middle",
        };
      }
    },
  );

  // ==========================================================================
  // Column Width
  // ==========================================================================

  worksheet.getColumn(1).width = 7;
  worksheet.getColumn(2).width = 30;
  worksheet.getColumn(3).width = 24;
  worksheet.getColumn(4).width = 18;

  for (
    let index = 0;
    index < maxInstallments;
    index++
  ) {
    const start =
      installmentStartColumn +
      index * 2;

    worksheet.getColumn(
      start,
    ).width = 18;

    worksheet.getColumn(
      start + 1,
    ).width = 16;
  }

  worksheet.getColumn(
    totalInvoiceColumn,
  ).width = 18;

  worksheet.getColumn(
    paidColumn,
  ).width = 18;

  worksheet.getColumn(
    outstandingColumn,
  ).width = 18;

  worksheet.getColumn(
    statusColumn,
  ).width = 18;

  worksheet.getRow(1).height = 24;
  worksheet.getRow(2).height = 28;

  // ==========================================================================
  // Filter
  // ==========================================================================

  worksheet.autoFilter = {
    from: {
      row: 2,
      column: 1,
    },
    to: {
      row: 2,
      column: lastColumn,
    },
  };

  // ==========================================================================
  // Buffer
  // ==========================================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}