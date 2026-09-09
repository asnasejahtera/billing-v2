/*
 * =========================
 * STANDARD FIBER COLORS
 * =========================
 */
const FIBER_CORE_COLORS = [
  "BLUE",
  "ORANGE",
  "GREEN",
  "BROWN",
  "SLATE",
  "WHITE",
  "RED",
  "BLACK",
  "YELLOW",
  "VIOLET",
  "ROSE",
  "AQUA",
] as const;

export function getFiberCoreColor(
  coreNumber: number,
) {
  const index =
    (coreNumber - 1) %
    FIBER_CORE_COLORS.length;

  return FIBER_CORE_COLORS[index];
}

export function createFiberCoreDefinitions(
  coreCount: number,
) {
  return Array.from(
    { length: coreCount },
    (_, index) => {
      const coreNumber = index + 1;

      return {
        coreNumber,
        color: getFiberCoreColor(coreNumber),
      };
    },
  );
}