"use server";

import { getHsgqOnuList } from "@/features/olts/services/hsgq-onu.service";
import type { HsgqOnuListResult } from "@/features/olts/types/hsgq-onu";

export type RefreshHsgqOnuResult =
  | {
      success: true;
      message: string;
      result: HsgqOnuListResult;
      refreshedAt: string;
    }
  | {
      success: false;
      message: string;
    };

export async function refreshHsgqOnuAction(): Promise<RefreshHsgqOnuResult> {
  try {
    const result = await getHsgqOnuList();

    return {
      success: true,
      message: "Data ONU berhasil diperbarui",
      result,
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui data ONU",
    };
  }
}