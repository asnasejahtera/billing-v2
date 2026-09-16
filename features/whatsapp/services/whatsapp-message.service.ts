import {
  createWhatsAppTestMessage,
  findWhatsAppMessageById,
} from "../repositories/whatsapp-message.repository";

import {
  getWhatsAppConnectionSnapshotService,
} from "./whatsapp-connection.service";

/**
 * ============================================
 * NORMALIZE INDONESIAN NUMBER
 * ============================================
 *
 * 0812... → 62812...
 * 812...  → 62812...
 * +628... → 628...
 */
function normalizePhone(
  value: string,
) {
  let phone =
    value.replace(
      /\D/g,
      "",
    );

  if (
    phone.startsWith("0")
  ) {
    phone =
      `62${phone.slice(1)}`;
  } else if (
    phone.startsWith("8")
  ) {
    phone =
      `62${phone}`;
  }

  if (
    !phone.startsWith("62") ||
    phone.length < 10 ||
    phone.length > 15
  ) {
    throw new Error(
      "Gunakan nomor Indonesia yang valid, contoh 081234567890.",
    );
  }

  return phone;
}

/**
 * ============================================
 * RESOLVE AVAILABLE AT
 * ============================================
 */
function resolveAvailableAt(
  scheduledAt?:
    | string
    | null,
) {
  if (!scheduledAt) {
    return {
      availableAt:
        new Date(),

      scheduled: false,
    };
  }

  const date =
    new Date(
      scheduledAt,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Waktu jadwal tidak valid.",
    );
  }

  /**
   * Beri toleransi kecil agar request yang
   * sedang diproses tidak dianggap lampau.
   */
  if (
    date.getTime() <
    Date.now() + 30_000
  ) {
    throw new Error(
      "Waktu pengiriman harus lebih dari 30 detik dari sekarang.",
    );
  }

  return {
    availableAt: date,
    scheduled: true,
  };
}

/**
 * ============================================
 * CREATE TEST MESSAGE
 * ============================================
 */
export async function createWhatsAppTestMessageService(
  input: {
    phone: string;
    body: string;
    scheduledAt?:
      | string
      | null;
  },
) {
  const connection =
    await getWhatsAppConnectionSnapshotService();

  if (
    !connection.workerOnline ||
    connection.status !==
      "READY"
  ) {
    return {
      success:
        false as const,

      message:
        "WhatsApp belum siap mengirim pesan.",
    };
  }

  let phone: string;

  try {
    phone =
      normalizePhone(
        input.phone,
      );
  } catch (error) {
    return {
      success:
        false as const,

      message:
        error instanceof Error
          ? error.message
          : "Nomor WhatsApp tidak valid.",
    };
  }

  let schedule: {
    availableAt: Date;
    scheduled: boolean;
  };

  try {
    schedule =
      resolveAvailableAt(
        input.scheduledAt,
      );
  } catch (error) {
    return {
      success:
        false as const,

      message:
        error instanceof Error
          ? error.message
          : "Jadwal tidak valid.",
    };
  }

  const message =
    await createWhatsAppTestMessage(
      {
        phone,

        body:
          input.body.trim(),

        availableAt:
          schedule.availableAt,
      },
    );

  return {
    success:
      true as const,

    id: message.id,

    scheduled:
      schedule.scheduled,

    availableAt:
      schedule.availableAt
        .toISOString(),

    message:
      schedule.scheduled
        ? "Pesan berhasil dijadwalkan."
        : "Pesan masuk antrean.",
  };
}

/**
 * ============================================
 * MESSAGE STATUS
 * ============================================
 */
export async function getWhatsAppMessageStatusService(
  id: number,
) {
  return findWhatsAppMessageById(
    id,
  );
}