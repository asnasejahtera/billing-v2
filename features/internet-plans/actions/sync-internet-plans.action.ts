"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { syncInternetPlansSchema } from "@/features/internet-plans/schemas/sync-internet-plans.schema";
import {
  InternetPlanSyncError,
  syncInternetPlansFromRouterService,
} from "@/features/internet-plans/services/sync-internet-plans.service";
import type { SyncInternetPlansActionState } from "@/features/internet-plans/types/sync-internet-plans-action-state";

export async function syncInternetPlansAction(
  _previousState:
    SyncInternetPlansActionState,
  formData: FormData,
): Promise<SyncInternetPlansActionState> {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk sinkron paket",
    };
  }

  const validation =
    syncInternetPlansSchema.safeParse({
      routerId:
        formData.get("routerId"),
    });

  if (!validation.success) {
    return {
      success: false,
      message:
        "Router tidak valid",
    };
  }

  try {
    const result =
      await syncInternetPlansFromRouterService(
        validation.data.routerId,
      );

    revalidatePath("/plans");

    return {
      success: true,
      synced: result.synced,
      message:
        `${result.synced} paket berhasil disinkron dari ${result.routerName}`,
    };
  } catch (error) {
    if (
      error instanceof
      InternetPlanSyncError
    ) {
      return {
        success: false,
        message:
          error.message,
      };
    }

    console.error(
      "Sync internet plans:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat sinkron paket",
    };
  }
}