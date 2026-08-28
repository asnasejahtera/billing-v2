"use server";

import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  getCurrentUser,
} from "@/features/auth/services/current-user.service";

import {
  updateCustomerSchema,
} from "@/features/customers/schemas/update-customer.schema";

import {
  CustomerServiceError,
  updateCustomerService,
} from "@/features/customers/services/customer.service";

import type {
  UpdateCustomerActionState,
} from "@/features/customers/types/update-customer-action-state";

export async function updateCustomerAction(
  _previousState:
    UpdateCustomerActionState,
  formData: FormData,
): Promise<UpdateCustomerActionState> {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk mengubah Customer",
    };
  }

  const validation =
    updateCustomerSchema.safeParse({
      id:
        formData.get("id"),

      name:
        formData.get("name"),

      phone:
        formData.get("phone"),

      internetPlanId:
        formData.get(
          "internetPlanId",
        ),

      pppoeUsername:
        formData.get(
          "pppoeUsername",
        ),

      pppoePassword:
        formData.get(
          "pppoePassword",
        ),

      address:
        formData.get(
          "address",
        ),

      localAddress:
        formData.get(
          "localAddress",
        ),

      remoteAddress:
        formData.get(
          "remoteAddress",
        ),

      cpeBrand:
        formData.get(
          "cpeBrand",
        ),

      ontSerialNumber:
        formData.get(
          "ontSerialNumber",
        ),

      detail:
        formData.get(
          "detail",
        ),

      status:
        formData.get(
          "status",
        ),
    });

  if (
    !validation.success
  ) {
    return {
      success: false,

      message:
        "Periksa field yang ditandai",

      errors:
        validation.error
          .flatten()
          .fieldErrors,
    };
  }

  try {
    await updateCustomerService(
      validation.data,
    );
  } catch (error) {
    if (
      error instanceof
      CustomerServiceError
    ) {
      return {
        success: false,

        message:
          error.message,

        errors:
          error.field
            ? {
                [error.field]:
                  [
                    error.message,
                  ],
              }
            : undefined,
      };
    }

    throw error;
  }

  revalidatePath(
    "/customers",
  );

  redirect(
    "/customers?updated=1&sort=createdAt&order=desc",
  );
}