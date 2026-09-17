import { Workbook } from "exceljs";

import {
  listCustomersForPaymentRecapExport,
  listInvoicesForPaymentRecapExport,
  listPaymentsForPaymentRecapExport,
} from "../repositories/payment-recap-export.repository";

// ============================================================================
// Helpers
// ============================================================================

function invoiceMonth(invoice: {
  source: "AUTO" | "MANUAL";
  billingPeriod: string | null;
  invoiceDate: string;
}) {
  if (
    invoice.source === "AUTO" &&
    invoice.billingPeriod
  ) {
    return invoice.billingPeriod;
  }

  return invoice.invoiceDate.slice(0, 7);
}

function paymentMonth(paymentDate: string) {
  return paymentDate.slice(0, 7);
}

function monthLabel(month: string) {
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

function dueDay(dueDate: string) {
  return Number(
    dueDate.slice(8, 10),
  );
}

// ============================================================================
// Create Workbook
// ============================================================================

export async function createPaymentRecapExcel(
  selectedMonths: string[],
) {
  const months = [
    ...new Set(selectedMonths),
  ].sort();

  const latestMonth =
    months[months.length - 1];

  const [
    customers,
    invoiceRows,
    paymentRows,
  ] = await Promise.all([
    listCustomersForPaymentRecapExport(),
    listInvoicesForPaymentRecapExport(months),
    listPaymentsForPaymentRecapExport(months),
  ]);

  // ==========================================================================
  // Invoice Aggregate
  // ==========================================================================

  const invoiceMap = new Map<
    string,
    {
      total: number;
      dueDay: number | null;
      latestDueDate: string | null;
    }
  >();

  for (const invoice of invoiceRows) {
    const month =
      invoiceMonth(invoice);

    const key =
      `${invoice.customerId}|${month}`;

    const current =
      invoiceMap.get(key) ?? {
        total: 0,
        dueDay: null,
        latestDueDate: null,
      };

    current.total +=
      Number(invoice.total);

    if (
      !current.latestDueDate ||
      invoice.dueDate >
        current.latestDueDate
    ) {
      current.latestDueDate =
        invoice.dueDate;

      current.dueDay =
        dueDay(invoice.dueDate);
    }

    invoiceMap.set(
      key,
      current,
    );
  }

  // ==========================================================================
  // Last Payment Method per Customer / Calendar Month
  // ==========================================================================

  const paymentMap = new Map<
    string,
    {
      paymentDate: string;
      paymentId: number;
      method: string;
    }
  >();

  for (const payment of paymentRows) {
    const month =
      paymentMonth(
        payment.paymentDate,
      );

    const key =
      `${payment.customerId}|${month}`;

    const current =
      paymentMap.get(key);

    if (
      !current ||
      payment.paymentDate >
        current.paymentDate ||
      (
        payment.paymentDate ===
          current.paymentDate &&
        payment.id >
          current.paymentId
      )
    ) {
      paymentMap.set(
        key,
        {
          paymentDate:
            payment.paymentDate,
          paymentId:
            payment.id,
          method:
            payment.method,
        },
      );
    }
  }

  // ==========================================================================
  // Workbook
  // ==========================================================================

  const workbook =
    new Workbook();

  workbook.creator =
    "Billing MikroTik";

  workbook.created =
    new Date();

  const worksheet =
    workbook.addWorksheet(
      "Rekap Pembayaran",
      {
        views: [
          {
            state: "frozen",
            ySplit: 2,
            xSplit: 3,
          },
        ],
      },
    );

  // ==========================================================================
  // Column Positions
  // ==========================================================================

  const firstMonthColumn =
    4;

  const latestMonthColumn =
    firstMonthColumn +
    months.length -
    1;

  const billColumn =
    firstMonthColumn +
    months.length;

  // ==========================================================================
  // Top Header
  // ==========================================================================

  worksheet.mergeCells(
    1,
    latestMonthColumn,
    1,
    billColumn,
  );

  const currentHeader =
    worksheet.getCell(
      1,
      latestMonthColumn,
    );

  currentHeader.value =
    monthLabel(latestMonth);

  currentHeader.font = {
    bold: true,
    italic: true,
    size: 12,
  };

  currentHeader.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  currentHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFFFFF00",
    },
  };

  // ==========================================================================
  // Main Headers
  // ==========================================================================

  worksheet.getCell(
    2,
    1,
  ).value = "NO";

  worksheet.getCell(
    2,
    2,
  ).value = "NAMA";

  worksheet.getCell(
    2,
    3,
  ).value = "TANGGAL BAYAR";

  months.forEach(
    (
      month,
      index,
    ) => {
      worksheet.getCell(
        2,
        firstMonthColumn +
          index,
      ).value =
        monthLabel(month);
    },
  );

  worksheet.getCell(
    2,
    billColumn,
  ).value = "TAGIHAN";

  // ==========================================================================
  // Header Styling
  // ==========================================================================

  const yellowHeaders = [
    1,
    2,
    3,
  ];

  for (
    const column of
    yellowHeaders
  ) {
    const cell =
      worksheet.getCell(
        2,
        column,
      );

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFFFF00",
      },
    };

    cell.font = {
      bold: true,
      italic: true,
    };
  }

  for (
    let column =
      firstMonthColumn;
    column <=
      latestMonthColumn;
    column++
  ) {
    const cell =
      worksheet.getCell(
        2,
        column,
      );

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFD9D9D9",
      },
    };

    cell.font = {
      bold: true,
      italic: true,
    };
  }

  const billHeader =
    worksheet.getCell(
      2,
      billColumn,
    );

  billHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF39FF14",
    },
  };

  billHeader.font = {
    bold: true,
    italic: true,
  };

  // ==========================================================================
  // Header Alignment / Border
  // ==========================================================================

  for (
    let column = 1;
    column <= billColumn;
    column++
  ) {
    const cell =
      worksheet.getCell(
        2,
        column,
      );

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

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
  }

  // ==========================================================================
  // Customer Rows
  // ==========================================================================

  customers.forEach(
    (
      customer,
      index,
    ) => {
      const row =
        index + 3;

      worksheet.getCell(
        row,
        1,
      ).value =
        index + 1;

      worksheet.getCell(
        row,
        2,
      ).value =
        customer.name;

      // ----------------------------------------------------------------------
      // Tanggal Bayar / Due Day
      // Prioritas invoice bulan terakhir, fallback invoice terakhir yang ada.
      // ----------------------------------------------------------------------

      let customerDueDay =
        invoiceMap.get(
          `${customer.id}|${latestMonth}`,
        )?.dueDay ??
        null;

      if (
        customerDueDay ===
        null
      ) {
        for (
          let monthIndex =
            months.length -
            1;
          monthIndex >= 0;
          monthIndex--
        ) {
          const value =
            invoiceMap.get(
              `${customer.id}|${months[monthIndex]}`,
            )?.dueDay;

          if (value) {
            customerDueDay =
              value;

            break;
          }
        }
      }

      worksheet.getCell(
        row,
        3,
      ).value =
        customerDueDay
          ? `TANGGAL ${customerDueDay}`
          : "-";

      // ----------------------------------------------------------------------
      // Payment Method per Month
      // ----------------------------------------------------------------------

      months.forEach(
        (
          month,
          monthIndex,
        ) => {
          const column =
            firstMonthColumn +
            monthIndex;

          const payment =
            paymentMap.get(
              `${customer.id}|${month}`,
            );

          const value =
            payment?.method ??
            "KOSONG";

          const cell =
            worksheet.getCell(
              row,
              column,
            );

          cell.value =
            value;

          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
          };

          // ==================================================================
          // Method Coloring
          // ==================================================================

          if (
            value === "CASH"
          ) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  "FFC6EFCE",
              },
            };

            cell.font = {
              color: {
                argb:
                  "FF006100",
              },
            };
          } else if (
            value ===
            "TRANSFER"
          ) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  "FF5B9BD5",
              },
            };

            cell.font = {
              color: {
                argb:
                  "FFFFFFFF",
              },
            };
          } else if (
            value === "QRIS"
          ) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  "FFE4DFEC",
              },
            };
          } else if (
            value ===
            "EWALLET"
          ) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  "FFFCE4D6",
              },
            };
          } else if (
            value === "OTHER"
          ) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  "FFFFF2CC",
              },
            };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  "FFE7E6E6",
              },
            };
          }
        },
      );

      // ----------------------------------------------------------------------
      // Tagihan = total invoice bulan terakhir yang dipilih.
      // ----------------------------------------------------------------------

      const latestInvoice =
        invoiceMap.get(
          `${customer.id}|${latestMonth}`,
        );

      const billCell =
        worksheet.getCell(
          row,
          billColumn,
        );

      billCell.value =
        latestInvoice?.total ??
        0;

      billCell.numFmt =
        '"Rp"#,##0';

      // ----------------------------------------------------------------------
      // Row Alignment / Border
      // ----------------------------------------------------------------------

      worksheet.getCell(
        row,
        1,
      ).alignment = {
        horizontal:
          "center",
      };

      worksheet.getCell(
        row,
        3,
      ).alignment = {
        horizontal:
          "left",
      };

      for (
        let column = 1;
        column <=
          billColumn;
        column++
      ) {
        const cell =
          worksheet.getCell(
            row,
            column,
          );

        cell.alignment = {
          ...cell.alignment,
          vertical: "middle",
        };

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
      }
    },
  );

  // ==========================================================================
  // Dimensions
  // ==========================================================================

  worksheet.getColumn(1).width =
    7;

  worksheet.getColumn(2).width =
    35;

  worksheet.getColumn(3).width =
    18;

  months.forEach(
    (
      _,
      index,
    ) => {
      worksheet.getColumn(
        firstMonthColumn +
          index,
      ).width = 18;
    },
  );

  worksheet.getColumn(
    billColumn,
  ).width = 18;

  worksheet.getRow(1).height =
    24;

  worksheet.getRow(2).height =
    24;

  // ==========================================================================
  // Auto Filter
  // ==========================================================================

  worksheet.autoFilter = {
    from: {
      row: 2,
      column: 1,
    },
    to: {
      row: 2,
      column:
        billColumn,
    },
  };

  // ==========================================================================
  // Buffer
  // ==========================================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(
    buffer,
  );
}