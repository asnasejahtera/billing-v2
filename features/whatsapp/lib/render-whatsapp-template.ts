/**
 * ============================================
 * TYPES
 * ============================================
 */
export type WhatsAppTemplateValues =
  Record<
    string,
    string | number | null | undefined
  >;

export type RenderWhatsAppTemplateResult =
  | {
      success: true;
      body: string;
      missingVariables: [];
    }
  | {
      success: false;
      body: string;
      missingVariables: string[];
    };

/**
 * ============================================
 * VARIABLE REGEX
 * ============================================
 *
 * Format:
 * {{customer_name}}
 * {{amount}}
 * {{due_date}}
 */
const VARIABLE_PATTERN =
  /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * ============================================
 * FIND TEMPLATE VARIABLES
 * ============================================
 */
export function findWhatsAppTemplateVariables(
  body: string,
): string[] {
  const variables =
    new Set<string>();

  for (
    const match of
    body.matchAll(
      VARIABLE_PATTERN,
    )
  ) {
    const key =
      match[1];

    if (key) {
      variables.add(
        key,
      );
    }
  }

  return [
    ...variables,
  ];
}

/**
 * ============================================
 * RENDER TEMPLATE
 * ============================================
 *
 * Contoh:
 *
 * body:
 * Halo {{customer_name}}
 *
 * values:
 * {
 *   customer_name: "Budi"
 * }
 *
 * hasil:
 * Halo Budi
 */
export function renderWhatsAppTemplate(
  body: string,
  values: WhatsAppTemplateValues,
): RenderWhatsAppTemplateResult {
  const variables =
    findWhatsAppTemplateVariables(
      body,
    );

  /**
   * ========================================
   * CHECK MISSING VARIABLES
   * ========================================
   */
  const missingVariables =
    variables.filter(
      (key) => {
        const value =
          values[key];

        return (
          value ===
            undefined ||
          value ===
            null ||
          String(
            value,
          ).trim() ===
            ""
        );
      },
    );

  /**
   * ========================================
   * REPLACE VARIABLES
   * ========================================
   */
  const rendered =
    body.replace(
      VARIABLE_PATTERN,
      (
        original,
        key: string,
      ) => {
        const value =
          values[key];

        /**
         * Variable tidak ada:
         * pertahankan placeholder agar mudah
         * terlihat saat preview/debug.
         */
        if (
          value ===
            undefined ||
          value ===
            null ||
          String(
            value,
          ).trim() ===
            ""
        ) {
          return original;
        }

        return String(
          value,
        );
      },
    );

  if (
    missingVariables.length >
    0
  ) {
    return {
      success: false,
      body: rendered,
      missingVariables,
    };
  }

  return {
    success: true,
    body: rendered,
    missingVariables: [],
  };
}