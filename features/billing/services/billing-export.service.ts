import ExcelJS from "exceljs";

import {
  listCustomersForBillingExport,
  listInvoicesForBillingExport,
  listPaymentsForBillingExport,
} from "../repositories/billing-export.repository";

// ============================================================================
// Types
// ============================================================================

type MonthData = {
  totalInvoice: number;
  totalPaid: number;
  lastPaymentDate: string | null;
  outstanding: number;
  overdue: number;
};

type CustomerExportData = {
  id: number;
  pppoeUsername: string;
  name: string;
  months: Record<string, MonthData>;
};

// ============================================================================
// Date Helpers
// ============================================================================

function getJakartaDate() {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(new Date());

  const year =
    parts.find((part) => part.type === "year")?.value ?? "";

  const month =
    parts.find((part) => part.type === "month")?.value ?? "";

  const day =
    parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function getInvoiceMonth(invoice: {
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

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const [year, month, day] =
    value.split("-");

  return `${day}/${month}/${year}`;
}

function getMonthLabel(month: string) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  const label =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        month: "long",
        year: "numeric",
      },
    ).format(
      new Date(
        year,
        monthNumber - 1,
        1,
      ),
    );

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  );
}

// ============================================================================
// Build Data
// ============================================================================

async function buildExportData(
  selectedMonths: string[],
) {
  const months =
    [...new Set(selectedMonths)]
      .sort();

  const customers =
    await listCustomersForBillingExport();

  const invoiceRows =
    await listInvoicesForBillingExport(
      months,
    );

  const paymentRows =
    await listPaymentsForBillingExport(
      invoiceRows.map(
        (invoice) => invoice.id,
      ),
    );

  // ==========================================================================
  // Payment per Invoice
  // ==========================================================================

  const paymentsByInvoice =
    new Map<
      number,
      {
        total: number;
        lastDate: string | null;
      }
    >();

  for (const payment of paymentRows) {
    const current =
      paymentsByInvoice.get(
        payment.invoiceId,
      ) ?? {
        total: 0,
        lastDate: null,
      };

    current.total +=
      Number(payment.amount);

    if (
      !current.lastDate ||
      payment.paymentDate >
        current.lastDate
    ) {
      current.lastDate =
        payment.paymentDate;
    }

    paymentsByInvoice.set(
      payment.invoiceId,
      current,
    );
  }

  // ==========================================================================
  // Customer Base
  // ==========================================================================

  const customerMap =
    new Map<
      number,
      CustomerExportData
    >();

  for (const customer of customers) {
    const monthData: Record<
      string,
      MonthData
    > = {};

    for (const month of months) {
      monthData[month] = {
        totalInvoice: 0,
        totalPaid: 0,
        lastPaymentDate: null,
        outstanding: 0,
        overdue: 0,
      };
    }

    customerMap.set(
      customer.id,
      {
        id: customer.id,
        pppoeUsername:
          customer.pppoeUsername,
        name:
          customer.name,
        months:
          monthData,
      },
    );
  }

  // ==========================================================================
  // Aggregate Invoice per Customer / Month
  // ==========================================================================

  const today =
    getJakartaDate();

  for (const invoice of invoiceRows) {
    const month =
      getInvoiceMonth(
        invoice,
      );

    if (
      !months.includes(
        month,
      )
    ) {
      continue;
    }

    const customer =
      customerMap.get(
        invoice.customerId,
      );

    if (!customer) {
      continue;
    }

    const monthData =
      customer.months[
        month
      ];

    const total =
      Number(
        invoice.total,
      );

    const payment =
      paymentsByInvoice.get(
        invoice.id,
      ) ?? {
        total: 0,
        lastDate: null,
      };

    const paid =
      payment.total;

    const outstanding =
      Math.max(
        total - paid,
        0,
      );

    monthData.totalInvoice +=
      total;

    monthData.totalPaid +=
      paid;

    monthData.outstanding +=
      outstanding;

    if (
      invoice.dueDate <
        today &&
      outstanding > 0
    ) {
      monthData.overdue +=
        outstanding;
    }

    if (
      payment.lastDate &&
      (
        !monthData.lastPaymentDate ||
        payment.lastDate >
          monthData.lastPaymentDate
      )
    ) {
      monthData.lastPaymentDate =
        payment.lastDate;
    }
  }

  return {
    months,
    customers:
      [...customerMap.values()],
  };
}

// ============================================================================
// Build Excel
// ============================================================================

export async function createBillingExcel(
  selectedMonths: string[],
) {
  const {
    months,
    customers,
  } =
    await buildExportData(
      selectedMonths,
    );

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Billing MikroTik";

  workbook.created =
    new Date();

  const worksheet =
    workbook.addWorksheet(
      "Billing Pelanggan",
      {
        views: [
          {
            state: "frozen",
            xSplit: 3,
            ySplit: 2,
          },
        ],
      },
    );

  // ==========================================================================
  // Static Headers
  // ==========================================================================

  worksheet.mergeCells(
    "A1:A2",
  );
  worksheet.mergeCells(
    "B1:B2",
  );
  worksheet.mergeCells(
    "C1:C2",
  );

  worksheet.getCell(
    "A1",
  ).value = "No";

  worksheet.getCell(
    "B1",
  ).value = "User PPPoE";

  worksheet.getCell(
    "C1",
  ).value = "Nama Customer";

  // ==========================================================================
  // Dynamic Month Headers
  // ==========================================================================

  const monthColumns =
    new Map<
      string,
      {
        totalInvoice: number;
        totalPaid: number;
        lastPaymentDate: number;
        outstanding: number;
        status: number;
        overdue: number;
      }
    >();

  months.forEach(
    (
      month,
      index,
    ) => {
      const start =
        4 +
        index * 6;

      const end =
        start + 5;

      worksheet.mergeCells(
        1,
        start,
        1,
        end,
      );

      worksheet.getCell(
        1,
        start,
      ).value =
        getMonthLabel(
          month,
        );

      const headers = [
        "Total Tagihan",
        "Total Bayar",
        "Tanggal Bayar Terakhir",
        "Kurang Bayar",
        "Keterangan",
        "Tunggakan",
      ];

      headers.forEach(
        (
          header,
          headerIndex,
        ) => {
          worksheet.getCell(
            2,
            start +
              headerIndex,
          ).value =
            header;
        },
      );

      monthColumns.set(
        month,
        {
          totalInvoice:
            start,
          totalPaid:
            start + 1,
          lastPaymentDate:
            start + 2,
          outstanding:
            start + 3,
          status:
            start + 4,
          overdue:
            start + 5,
        },
      );
    },
  );

  // ==========================================================================
  // Header Style
  // ==========================================================================

  const lastColumn =
    3 +
    months.length * 6;

  for (
    let row = 1;
    row <= 2;
    row++
  ) {
    for (
      let column = 1;
      column <=
      lastColumn;
      column++
    ) {
      const cell =
        worksheet.getCell(
          row,
          column,
        );

      cell.font = {
        bold: true,
      };

      cell.alignment = {
        horizontal:
          "center",
        vertical:
          "middle",
        wrapText: true,
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb:
            "FFE5E7EB",
        },
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
  }

  worksheet.getRow(1).height =
    24;

  worksheet.getRow(2).height =
    34;

  // ==========================================================================
  // Customer Rows
  // ==========================================================================

  customers.forEach(
    (
      customer,
      customerIndex,
    ) => {
      const rowNumber =
        customerIndex +
        3;

      worksheet.getCell(
        rowNumber,
        1,
      ).value =
        customerIndex +
        1;

      worksheet.getCell(
        rowNumber,
        2,
      ).value =
        customer.pppoeUsername;

      worksheet.getCell(
        rowNumber,
        3,
      ).value =
        customer.name;

      months.forEach(
        (month) => {
          const columns =
            monthColumns.get(
              month,
            );

          if (!columns) {
            return;
          }

          const data =
            customer.months[
              month
            ];

          const status =
            data.totalInvoice <=
            0
              ? "-"
              : data.outstanding <=
                  0
                ? "LUNAS"
                : "BELUM LUNAS";

          // ------------------------------------------------------------------
          // Values
          // ------------------------------------------------------------------

          worksheet.getCell(
            rowNumber,
            columns.totalInvoice,
          ).value =
            data.totalInvoice;

          worksheet.getCell(
            rowNumber,
            columns.totalPaid,
          ).value =
            data.totalPaid;

          worksheet.getCell(
            rowNumber,
            columns.lastPaymentDate,
          ).value =
            formatDate(
              data.lastPaymentDate,
            );

          worksheet.getCell(
            rowNumber,
            columns.outstanding,
          ).value =
            data.outstanding;

          worksheet.getCell(
            rowNumber,
            columns.status,
          ).value =
            status;

          worksheet.getCell(
            rowNumber,
            columns.overdue,
          ).value =
            data.overdue;

          // ------------------------------------------------------------------
          // Currency
          // ------------------------------------------------------------------

          for (const column of [
            columns.totalInvoice,
            columns.totalPaid,
            columns.outstanding,
            columns.overdue,
          ]) {
            worksheet.getCell(
              rowNumber,
              column,
            ).numFmt =
              '"Rp" #,##0';
          }

          // ------------------------------------------------------------------
          // Status Background
          // ------------------------------------------------------------------

          const statusCell =
            worksheet.getCell(
              rowNumber,
              columns.status,
            );

          statusCell.alignment = {
            horizontal:
              "center",
            vertical:
              "middle",
          };

          if (
            status ===
            "LUNAS"
          ) {
            statusCell.fill = {
              type:
                "pattern",
              pattern:
                "solid",
              fgColor: {
                argb:
                  "FFDCFCE7",
              },
            };

            statusCell.font = {
              bold: true,
              color: {
                argb:
                  "FF166534",
              },
            };
          }

          if (
            status ===
            "BELUM LUNAS"
          ) {
            statusCell.fill = {
              type:
                "pattern",
              pattern:
                "solid",
              fgColor: {
                argb:
                  "FFFEE2E2",
              },
            };

            statusCell.font = {
              bold: true,
              color: {
                argb:
                  "FF991B1B",
              },
            };
          }
        },
      );

      // ----------------------------------------------------------------------
      // Row Borders
      // ----------------------------------------------------------------------

      for (
        let column = 1;
        column <=
        lastColumn;
        column++
      ) {
        worksheet.getCell(
          rowNumber,
          column,
        ).border = {
          top: {
            style:
              "thin",
          },
          left: {
            style:
              "thin",
          },
          bottom: {
            style:
              "thin",
          },
          right: {
            style:
              "thin",
          },
        };
      }
    },
  );

  // ==========================================================================
  // Column Width
  // ==========================================================================

  worksheet.getColumn(
    1,
  ).width = 7;

  worksheet.getColumn(
    2,
  ).width = 22;

  worksheet.getColumn(
    3,
  ).width = 30;

  months.forEach(
    (month) => {
      const columns =
        monthColumns.get(
          month,
        );

      if (!columns) {
        return;
      }

      worksheet.getColumn(
        columns.totalInvoice,
      ).width = 18;

      worksheet.getColumn(
        columns.totalPaid,
      ).width = 18;

      worksheet.getColumn(
        columns.lastPaymentDate,
      ).width = 22;

      worksheet.getColumn(
        columns.outstanding,
      ).width = 18;

      worksheet.getColumn(
        columns.status,
      ).width = 17;

      worksheet.getColumn(
        columns.overdue,
      ).width = 18;
    },
  );

  // ==========================================================================
  // Autofilter
  // ==========================================================================

  worksheet.autoFilter = {
    from: {
      row: 2,
      column: 1,
    },
    to: {
      row: 2,
      column:
        lastColumn,
    },
  };

  // ==========================================================================
  // XLSX Buffer
  // ==========================================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(
    buffer,
  );
}