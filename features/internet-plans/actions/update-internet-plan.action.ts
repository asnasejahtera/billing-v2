"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { updateInternetPlanSchema } from "@/features/internet-plans/schemas/update-internet-plan.schema";
import {
  InternetPlanServiceError,
  updateInternetPlanService,
} from "@/features/internet-plans/services/internet-plan.service";
import type { UpdateInternetPlanActionState } from "@/features/internet-plans/types/update-internet-plan-action-state";

export async function updateInternetPlanAction(
  _previousState:
    UpdateInternetPlanActionState,
  formData: FormData,
): Promise<UpdateInternetPlanActionState> {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk mengubah paket",
    };
  }

  const validation =
    updateInternetPlanSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      price: formData.get("price"),
    });

  if (!validation.success) {
    return {
      success: false,
      message:
        "Periksa kembali data paket",
      errors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  try {
    await updateInternetPlanService(
      validation.data,
    );

    revalidatePath("/plans");

    return {
      success: true,
      message:
        "Paket Internet berhasil diperbarui",
    };
  } catch (error) {
    if (
      error instanceof
      InternetPlanServiceError
    ) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error(
      "Update internet plan:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat memperbarui paket",
    };
  }
}