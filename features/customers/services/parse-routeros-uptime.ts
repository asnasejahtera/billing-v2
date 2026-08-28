export function parseRouterOsUptimeSeconds(
  value?: string,
) {
  if (!value) return 0;

  const units: Record<string, number> = {
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
  };

  let total = 0;

  for (
    const match of value.matchAll(
      /(\d+)(w|d|h|m|s)/g,
    )
  ) {
    total +=
      Number(match[1]) *
      units[match[2]];
  }

  return total;
}