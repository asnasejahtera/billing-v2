"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { syncCustomersSchema } from "@/features/customers/schemas/sync-customers.schema";
import {
  CustomerSyncError,
  syncCustomersFromRouterService,
} from "@/features/customers/services/sync-customers.service";
import type { SyncCustomersActionState } from "@/features/customers/types/sync-customers-action-state";

export async function syncCustomersAction(
  _previousState:
    SyncCustomersActionState,
  formData: FormData,
): Promise<SyncCustomersActionState> {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk sinkron Customer",
    };
  }

  const validation =
    syncCustomersSchema.safeParse({
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
      await syncCustomersFromRouterService(
        validation.data.routerId,
      );

    revalidatePath(
      "/customers",
    );

    let message =
      `${result.created} customer baru, ` +
      `${result.updated} diperbarui`;

    if (result.skipped > 0) {
      message +=
        `, ${result.skipped} dilewati`;

      if (
        result
          .skippedProfiles
          .length > 0
      ) {
        message +=
          ` karena paket belum ada: ` +
          result
            .skippedProfiles
            .join(", ");
      }
    }

    return {
      success: true,
      created:
        result.created,
      updated:
        result.updated,
      skipped:
        result.skipped,
      message,
    };
  } catch (error) {
    if (
      error instanceof
      CustomerSyncError
    ) {
      return {
        success: false,
        message:
          error.message,
      };
    }

    return {
      success: false,
      message:
        "Terjadi kesalahan saat sinkron Customer",
    };
  }
}