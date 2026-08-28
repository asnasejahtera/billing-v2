"use server";

import {
  revalidatePath,
} from "next/cache";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import {
  CustomerServiceError,
  isolateCustomerService,
} from "@/features/customers/services/customer.service";
import type { IsolateCustomerActionState } from "@/features/customers/types/isolate-customer-action-state";

export async function isolateCustomerAction(
  _previousState:
    IsolateCustomerActionState,
  formData: FormData,
): Promise<IsolateCustomerActionState> {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk mengisolir Customer",
    };
  }

  const rawCustomerId =
    formData.get(
      "customerId",
    );

  const customerId =
    Number(
      rawCustomerId,
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
    await isolateCustomerService(
      customerId,
    );

    revalidatePath(
      "/customers",
    );

    return {
      success: true,
      message:
        "Customer berhasil diisolir",
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