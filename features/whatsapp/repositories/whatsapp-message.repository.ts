import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  whatsappMessages,
} from "@/db/schema/whatsapp-messages";

/**
 * ============================================
 * CREATE TEST MESSAGE
 * ============================================
 */
export async function createWhatsAppTestMessage(
  input: {
    phone: string;
    body: string;
    availableAt: Date;
  },
) {
  const [message] = await db
    .insert(whatsappMessages)
    .values({
      clientKey: "default",
      source: "TEST",
      status: "PENDING",
      recipientPhone:
        input.phone,
      body: input.body,
      availableAt:
        input.availableAt,
    })
    .returning();

  if (!message) {
    throw new Error(
      "Pesan WhatsApp gagal dibuat.",
    );
  }

  return message;
}

/**
 * ============================================
 * GET MESSAGE STATUS
 * ============================================
 */
export async function findWhatsAppMessageById(
  id: number,
) {
  const [message] = await db
    .select({
      id:
        whatsappMessages.id,

      status:
        whatsappMessages.status,

      recipientPhone:
        whatsappMessages.recipientPhone,

      whatsappMessageId:
        whatsappMessages.whatsappMessageId,

      availableAt:
        whatsappMessages.availableAt,

      error:
        whatsappMessages.error,

      sentAt:
        whatsappMessages.sentAt,
    })
    .from(whatsappMessages)
    .where(
      eq(
        whatsappMessages.id,
        id,
      ),
    )
    .limit(1);

  return message ?? null;
}