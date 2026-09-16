import {
  normalizeWhatsAppPhone,
} from "../lib/normalize-whatsapp-phone";

import {
  renderWhatsAppTemplate,
} from "../lib/render-whatsapp-template";

import {
  getCustomerMessageRecipientsRepository,
  getCustomerMessageStatusRepository,
  insertCustomerMessageQueueRepository,
} from "../repositories/customer-message-send.repository";

import type {
  SendCustomerMessageInput,
} from "../schemas/customer-message-send.schema";

/**
 * ============================================
 * RANDOM DELAY
 * ============================================
 */
function randomDelaySeconds(
  min: number,
  max: number,
): number {
  return (
    Math.floor(
      Math.random() *
        (max - min + 1),
    ) + min
  );
}

/**
 * ============================================
 * SEND TO QUEUE
 * ============================================
 */
export async function sendCustomerMessageService(
  input: SendCustomerMessageInput,
) {
  const customers =
    await getCustomerMessageRecipientsRepository(
      input.customerIds,
    );

  /**
   * ========================================
   * VALID RECIPIENTS FIRST
   * ========================================
   *
   * Kita filter dulu supaya perhitungan delay
   * tidak terganggu customer invalid.
   */
  const recipients = customers
    .map((customer) => ({
      ...customer,
      whatsappPhone:
        normalizeWhatsAppPhone(
          customer.phone,
        ),
    }))
    .filter(
      (
        customer,
      ): customer is typeof customer & {
        whatsappPhone: string;
      } =>
        customer.whatsappPhone !== null,
    );

  if (!recipients.length) {
    return {
      success: false as const,
      message:
        "Tidak ada customer dengan nomor WhatsApp valid.",
    };
  }

  /**
   * ========================================
   * BUILD RANDOM SCHEDULE
   * ========================================
   *
   * #1 sekarang
   * #2 + random
   * #3 + random lagi
   * dst.
   */
  let scheduledAt =
    Date.now();

  const queue =
    recipients.map(
      (
        customer,
        index,
      ) => {
        /**
         * Pesan pertama boleh langsung.
         * Setiap pesan berikutnya harus punya
         * delay dari pesan sebelumnya.
         */
        if (index > 0) {
          scheduledAt +=
            randomDelaySeconds(
              input.minDelaySec,
              input.maxDelaySec,
            ) * 1000;
        }

        const rendered =
          renderWhatsAppTemplate(
            input.body,
            {
              customer_name:
                customer.name,
            },
          );

        return {
          source:
            "CUSTOMER" as const,

          status:
            "PENDING" as const,

          recipientPhone:
            customer.whatsappPhone,

          recipientName:
            customer.name,

          body:
            rendered.body,

          availableAt:
            new Date(
              scheduledAt,
            ),
        };
      },
    );

  /**
   * ========================================
   * INSERT
   * ========================================
   */
  const inserted =
    await insertCustomerMessageQueueRepository(
      queue,
    );

  return {
    success: true as const,

    message:
      `${inserted.length} pesan masuk antrean WhatsApp.`,

    messageIds:
      inserted.map(
        (message) =>
          message.id,
      ),

    queued:
      inserted.length,

    skipped:
      input.customerIds.length -
      inserted.length,
  };
}

/**
 * ============================================
 * DELIVERY STATUS
 * ============================================
 */
export async function getCustomerMessageStatusService(
  messageIds: number[],
) {
  const messages =
    await getCustomerMessageStatusRepository(
      messageIds,
    );

  let waiting = 0;
  let processing = 0;
  let sent = 0;
  let failed = 0;
  let cancelled = 0;

  for (
    const message of
    messages
  ) {
    switch (
      message.status
    ) {
      case "PENDING":
        waiting++;
        break;

      case "PROCESSING":
        processing++;
        break;

      case "SENT":
        sent++;
        break;

      case "FAILED":
        failed++;
        break;

      case "CANCELLED":
        cancelled++;
        break;
    }
  }

  return {
    total:
      messages.length,

    waiting,
    processing,
    sent,
    failed,
    cancelled,

    complete:
      waiting === 0 &&
      processing === 0,

    messages,
  };
}