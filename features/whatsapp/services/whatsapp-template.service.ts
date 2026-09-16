import {
  createWhatsAppTemplate,
  findWhatsAppTemplateById,
  findWhatsAppTemplateByKey,
  listWhatsAppTemplates,
  updateWhatsAppTemplate,
} from "../repositories/whatsapp-template.repository";

import type {
  CreateWhatsAppTemplateInput,
  UpdateWhatsAppTemplateInput,
} from "../schemas/whatsapp-template.schema";

/**
 * ============================================
 * DUPLICATE VARIABLE
 * ============================================
 */
function findDuplicateVariable(
  variables: {
    key: string;
  }[],
) {
  const keys =
    variables.map(
      (variable) =>
        variable.key,
    );

  return keys.find(
    (
      key,
      index,
    ) =>
      keys.indexOf(
        key,
      ) !== index,
  );
}

/**
 * ============================================
 * LIST
 * ============================================
 */
export async function listWhatsAppTemplatesService() {
  return listWhatsAppTemplates();
}

/**
 * ============================================
 * GET
 * ============================================
 */
export async function getWhatsAppTemplateService(
  id: number,
) {
  return findWhatsAppTemplateById(
    id,
  );
}

/**
 * ============================================
 * CREATE
 * ============================================
 */
export async function createWhatsAppTemplateService(
  input:
    CreateWhatsAppTemplateInput,
) {
  const existing =
    await findWhatsAppTemplateByKey(
      input.key,
    );

  if (existing) {
    return {
      success:
        false as const,

      message:
        `Template dengan key "${input.key}" sudah tersedia.`,
    };
  }

  const duplicate =
    findDuplicateVariable(
      input.variables,
    );

  if (duplicate) {
    return {
      success:
        false as const,

      message:
        `Variable "${duplicate}" digunakan lebih dari satu kali.`,
    };
  }

  const template =
    await createWhatsAppTemplate(
      input,
    );

  return {
    success:
      true as const,

    message:
      "Template WhatsApp berhasil dibuat.",

    template,
  };
}

/**
 * ============================================
 * UPDATE
 * ============================================
 */
export async function updateWhatsAppTemplateService(
  input:
    UpdateWhatsAppTemplateInput,
) {
  const existing =
    await findWhatsAppTemplateById(
      input.id,
    );

  if (!existing) {
    return {
      success:
        false as const,

      message:
        "Template WhatsApp tidak ditemukan.",
    };
  }

  const duplicate =
    findDuplicateVariable(
      input.variables,
    );

  if (duplicate) {
    return {
      success:
        false as const,

      message:
        `Variable "${duplicate}" digunakan lebih dari satu kali.`,
    };
  }

  const template =
    await updateWhatsAppTemplate(
      input,
    );

  if (!template) {
    return {
      success:
        false as const,

      message:
        "Template WhatsApp gagal diperbarui.",
    };
  }

  return {
    success:
      true as const,

    message:
      "Template WhatsApp berhasil diperbarui.",

    template,
  };
}