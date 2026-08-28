"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { testRouterConnectionSchema } from "@/features/routers/schemas/test-router-connection.schema";
import {
  RouterConnectionError,
  testRouterConnectionService,
} from "@/features/routers/services/test-router-connection.service";
import type { TestRouterConnectionActionState } from "@/features/routers/types/test-router-connection-action-state";

export async function testRouterConnectionAction(
  _previousState:
    TestRouterConnectionActionState,
  formData: FormData,
): Promise<TestRouterConnectionActionState> {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk menguji koneksi router",
    };
  }

  const validation =
    testRouterConnectionSchema.safeParse({
      id: formData.get("id"),
    });

  if (!validation.success) {
    return {
      success: false,
      message:
        "ID router tidak valid",
    };
  }

  try {
    const result =
    await testRouterConnectionService(
      validation.data.id,
    );

      revalidatePath("/routers");
      revalidatePath(
        `/routers/${validation.data.id}`,
      );

      return {
        success: true,
      message:
        `Terhubung ke ${result.identity}`,
      identity: result.identity,
    };
    
  } catch (error) {
    if (
      error instanceof
      RouterConnectionError
    ) {
      return {
        success: false,
        message:
          error.message,
      };
    }

    console.error(
      "Test router connection:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat menguji koneksi router",
    };
  }
}