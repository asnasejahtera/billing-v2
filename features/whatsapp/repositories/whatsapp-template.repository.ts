import {
  asc,
  eq,
} from "drizzle-orm";

import {
  db,
} from "@/db";

import {
  whatsappMessageTemplates,
} from "@/db/schema/whatsapp-message-templates";

import type {
  CreateWhatsAppTemplateInput,
  UpdateWhatsAppTemplateInput,
} from "../schemas/whatsapp-template.schema";

/**
 * ============================================
 * FIND BY ID
 * ============================================
 */
export async function findWhatsAppTemplateById(
  id: number,
) {
  const [template] =
    await db
      .select()
      .from(
        whatsappMessageTemplates,
      )
      .where(
        eq(
          whatsappMessageTemplates.id,
          id,
        ),
      )
      .limit(1);

  return template ?? null;
}

/**
 * ============================================
 * FIND BY KEY
 * ============================================
 */
export async function findWhatsAppTemplateByKey(
  key: string,
) {
  const [template] =
    await db
      .select()
      .from(
        whatsappMessageTemplates,
      )
      .where(
        eq(
          whatsappMessageTemplates.key,
          key,
        ),
      )
      .limit(1);

  return template ?? null;
}

/**
 * ============================================
 * CREATE
 * ============================================
 */
export async function createWhatsAppTemplate(
  input:
    CreateWhatsAppTemplateInput,
) {
  const [template] =
    await db
      .insert(
        whatsappMessageTemplates,
      )
      .values({
        key:
          input.key,

        name:
          input.name,

        category:
          input.category,

        description:
          input.description ||
          null,

        body:
          input.body,

        contentJson:
          input.contentJson,

        variables:
          input.variables,

        isActive:
          true,
      })
      .returning();

  if (!template) {
    throw new Error(
      "Template WhatsApp gagal dibuat.",
    );
  }

  return template;
}

/**
 * ============================================
 * UPDATE
 * ============================================
 */
export async function updateWhatsAppTemplate(
  input:
    UpdateWhatsAppTemplateInput,
) {
  const [template] =
    await db
      .update(
        whatsappMessageTemplates,
      )
      .set({
        name:
          input.name,

        category:
          input.category,

        description:
          input.description ||
          null,

        body:
          input.body,

        contentJson:
          input.contentJson,

        variables:
          input.variables,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          whatsappMessageTemplates.id,
          input.id,
        ),
      )
      .returning();

  return template ?? null;
}

/**
 * ============================================
 * LIST
 * ============================================
 */
export async function listWhatsAppTemplates() {
  return db
    .select()
    .from(
      whatsappMessageTemplates,
    )
    .orderBy(
      asc(
        whatsappMessageTemplates.category,
      ),
      asc(
        whatsappMessageTemplates.name,
      ),
    );
}