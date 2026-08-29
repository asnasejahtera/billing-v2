"use server";

import { revalidatePath } from "next/cache";

import { syncCustomersFromOltService } from "@/features/customers/services/customer-olt-sync.service";

export async function syncCustomersOltAction() {
  try {
    const result =
      await syncCustomersFromOltService();

    revalidatePath(
      "/customers",
    );

    return {
      success: true as const,
      message:
        `${result.updated} customer berhasil disinkronkan dengan OLT`,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Sinkronisasi OLT gagal",
    };
  }
}