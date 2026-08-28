"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { updateRouterSchema } from "@/features/routers/schemas/update-router.schema";
import {
  RouterServiceError,
  updateRouterService,
} from "@/features/routers/services/router.service";
import type { UpdateRouterActionState } from "@/features/routers/types/update-router-action-state";

export async function updateRouterAction(
  _previousState: UpdateRouterActionState,
  formData: FormData,
): Promise<UpdateRouterActionState> {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk mengubah router",
    };
  }

  const validation =
    updateRouterSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      host: formData.get("host"),
      port: formData.get("port"),
      username: formData.get("username"),
      password: formData.get("password"),
      useHttps:
        formData.get("useHttps") === "true",
      description:
        formData.get("description"),
    });

  if (!validation.success) {
    return {
      success: false,
      message:
        "Periksa kembali data router",
      errors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  try {
    await updateRouterService(
      validation.data,
    );

    revalidatePath("/routers");

    return {
      success: true,
      message:
        "Router berhasil diperbarui",
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
      "Update router error:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat memperbarui router",
    };
  }
}