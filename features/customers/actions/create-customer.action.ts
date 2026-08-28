"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import { createCustomerSchema } from "@/features/customers/schemas/create-customer.schema";
import {
  createCustomerService,
  CustomerServiceError,
} from "@/features/customers/services/customer.service";
import type { CreateCustomerActionState } from "@/features/customers/types/create-customer-action-state";

export async function createCustomerAction(
  _previousState: CreateCustomerActionState,
  formData: FormData,
): Promise<CreateCustomerActionState> {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Anda tidak memiliki izin untuk menambah Customer",
    };
  }

  const validation = createCustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    routerId: formData.get("routerId"),
    internetPlanId: formData.get("internetPlanId"),
    pppoeUsername: formData.get("pppoeUsername"),
    pppoePassword: formData.get("pppoePassword"),
    address: formData.get("address"),
    localAddress: formData.get("localAddress"),
    remoteAddress: formData.get("remoteAddress"),
    cpeBrand: formData.get("cpeBrand"),
    ontSerialNumber: formData.get("ontSerialNumber"),
    detail: formData.get("detail"),
    status: formData.get("status") || "ACTIVE",
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Periksa field yang ditandai",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await createCustomerService(
      validation.data,
    );

    revalidatePath("/customers");

    redirect(
      "/customers?created=1&sort=createdAt&order=desc",
    );
  } catch (error) {
    if (
      error instanceof
      CustomerServiceError
    ) {
      return {
        success: false,
        message: error.message,
        errors: error.field
          ? {
              [error.field]: [
                error.message,
              ],
            }
          : undefined,
      };
    }

    throw error;
  }
}