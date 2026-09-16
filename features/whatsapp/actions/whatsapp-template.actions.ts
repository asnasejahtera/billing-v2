"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createWhatsAppTemplateSchema,
  updateWhatsAppTemplateSchema,
} from "../schemas/whatsapp-template.schema";

import {
  createWhatsAppTemplateService,
  updateWhatsAppTemplateService,
} from "../services/whatsapp-template.service";

/**
 * ============================================
 * CREATE
 * ============================================
 */
export async function createWhatsAppTemplateAction(
  input: unknown,
) {
//   const user =
//     await getCurrentUser();

//   if (!user) {
//     return {
//       success:
//         false as const,

//       message:
//         "Authentication diperlukan.",
//     };
//   }

  const parsed =
    createWhatsAppTemplateSchema.safeParse(
      input,
    );

  if (
    !parsed.success
  ) {
    return {
      success:
        false as const,

      message:
        parsed.error
          .issues[0]
          ?.message ??
        "Data template tidak valid.",
    };
  }

  try {
    const result =
      await createWhatsAppTemplateService(
        parsed.data,
      );

    if (
      result.success
    ) {
      revalidatePath(
        "/whatsapp/templates",
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[WhatsApp Template] Create:",
      error,
    );

    return {
      success:
        false as const,

      message:
        "Template WhatsApp gagal dibuat.",
    };
  }
}

/**
 * ============================================
 * UPDATE
 * ============================================
 */
export async function updateWhatsAppTemplateAction(
  input: unknown,
) {
//   const user =
//     await getCurrentUser();

//   if (!user) {
//     return {
//       success:
//         false as const,

//       message:
//         "Authentication diperlukan.",
//     };
//   }

  const parsed =
    updateWhatsAppTemplateSchema.safeParse(
      input,
    );

  if (
    !parsed.success
  ) {
    return {
      success:
        false as const,

      message:
        parsed.error
          .issues[0]
          ?.message ??
        "Data template tidak valid.",
    };
  }

  try {
    const result =
      await updateWhatsAppTemplateService(
        parsed.data,
      );

    if (
      result.success
    ) {
      revalidatePath(
        "/whatsapp/templates",
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[WhatsApp Template] Update:",
      error,
    );

    return {
      success:
        false as const,

      message:
        "Template WhatsApp gagal diperbarui.",
    };
  }
}