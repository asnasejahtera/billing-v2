// ============================================================================
// Currency Formatter
// ============================================================================

export function formatCurrency(
  value:
    | string
    | number
    | null
    | undefined,
) {
  const amount =
    Number(value ?? 0);

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(amount);
}