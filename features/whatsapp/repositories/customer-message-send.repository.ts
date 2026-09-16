import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";
import { whatsappMessages } from "@/db/schema/whatsapp-messages";

/**
 * ============================================
 * GET RECIPIENTS
 * ============================================
 */
export async function getCustomerMessageRecipientsRepository(
  customerIds: number[],
) {
  if (!customerIds.length) return [];

  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
    })
    .from(customers)
    .where(
      inArray(
        customers.id,
        customerIds,
      ),
    );
}

/**
 * ============================================
 * INSERT QUEUE
 * ============================================
 */
export async function insertCustomerMessageQueueRepository(
  values: Array<
    typeof whatsappMessages.$inferInsert
  >,
) {
  if (!values.length) return [];

  return db
    .insert(whatsappMessages)
    .values(values)
    .returning({
      id: whatsappMessages.id,
      status: whatsappMessages.status,
      availableAt: whatsappMessages.availableAt,
    });
}

/**
 * ============================================
 * GET DELIVERY STATUS
 * ============================================
 */
export async function getCustomerMessageStatusRepository(
  messageIds: number[],
) {
  if (!messageIds.length) return [];

  return db
    .select({
      id: whatsappMessages.id,
      recipientName: whatsappMessages.recipientName,
      recipientPhone: whatsappMessages.recipientPhone,
      status: whatsappMessages.status,
      availableAt: whatsappMessages.availableAt,
      processingAt: whatsappMessages.processingAt,
      sentAt: whatsappMessages.sentAt,
      failedAt: whatsappMessages.failedAt,
      error: whatsappMessages.error,
    })
    .from(whatsappMessages)
    .where(
      inArray(
        whatsappMessages.id,
        messageIds,
      ),
    );
}