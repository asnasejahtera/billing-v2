"use server";

import {
  revalidatePath,
} from "next/cache";

import { getCurrentUser } from "@/features/auth/services/current-user.service";
import {
  CustomerServiceError,
  restoreCustomerService,
} from "@/features/customers/services/customer.service";

import type { RestoreCustomerActionState } from "@/features/customers/types/restore-customer-action-state";

export async function restoreCustomerAction(
  _previousState:
    RestoreCustomerActionState,
  formData: FormData,
): Promise<RestoreCustomerActionState> {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk membuka isolir Customer",
    };
  }

  const customerId =
    Number(
      formData.get(
        "customerId",
      ),
    );

  if (
    !Number.isSafeInteger(
      customerId,
    ) ||
    customerId <= 0
  ) {
    return {
      success: false,
      message:
        "ID Customer tidak valid",
    };
  }

  try {
    await restoreCustomerService(
      customerId,
    );

    revalidatePath(
      "/customers",
    );

    return {
      success: true,
      message:
        "Customer berhasil dibuka dari isolir",
    };
  } catch (error) {
    if (
      error instanceof
      CustomerServiceError
    ) {
      return {
        success: false,
        message:
          error.message,
      };
    }

    throw error;
  }
}