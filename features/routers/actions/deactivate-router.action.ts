"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { deactivateRouterSchema } from "@/features/routers/schemas/deactivate-router.schema";
import {
  deactivateRouterService,
  RouterServiceError,
} from "@/features/routers/services/router.service";
import type { DeactivateRouterActionState } from "@/features/routers/types/deactivate-router-action-state";

export async function deactivateRouterAction(
  _previousState: DeactivateRouterActionState,
  formData: FormData,
): Promise<DeactivateRouterActionState> {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk menonaktifkan router",
    };
  }

  const validation =
    deactivateRouterSchema.safeParse({
      id: formData.get("id"),
    });

  if (!validation.success) {
    return {
      success: false,
      message: "ID router tidak valid",
      errors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  try {
    await deactivateRouterService(
      validation.data.id,
    );

    revalidatePath("/routers");

    return {
      success: true,
      message:
        "Router berhasil dinonaktifkan",
    };
  } catch (error) {
    if (
      error instanceof RouterServiceError
    ) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error(
      "Deactivate router error:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat menonaktifkan router",
    };
  }
}