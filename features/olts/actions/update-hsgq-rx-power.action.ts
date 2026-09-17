"use server";

import { getHsgqRxPower } from "@/features/olts/services/hsgq-onu.service";

export async function updateHsgqRxPowerAction() {
  try {
    const data =
      await getHsgqRxPower();

    return {
      success: true as const,
      message:
        `${data.length} optical ONU berhasil diperbarui`,
      data,
      updatedAt:
        new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui RX Power",
    };
  }
}