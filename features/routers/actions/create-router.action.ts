"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { createRouterSchema } from "@/features/routers/schemas/create-router.schema";
import {
  createRouterService,
  RouterServiceError,
} from "@/features/routers/services/router.service";
import type { CreateRouterActionState } from "@/features/routers/types/create-router-action-state";

export async function createRouterAction(
  _previousState: CreateRouterActionState,
  formData: FormData,
): Promise<CreateRouterActionState> {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk menambahkan router",
    };
  }

  const validation =
    createRouterSchema.safeParse({
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
    await createRouterService(
      validation.data,
    );

    revalidatePath("/routers");

    return {
      success: true,
      message:
        "Router berhasil ditambahkan",
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
      "Create router error:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat menyimpan router",
    };
  }
}