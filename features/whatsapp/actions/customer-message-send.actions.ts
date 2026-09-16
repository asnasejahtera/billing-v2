"use server";

// import {
//   getCurrentUser,
// } from "@/lib/auth/get-current-user";

import {
  customerMessageStatusSchema,
  sendCustomerMessageSchema,
} from "../schemas/customer-message-send.schema";

import {
  getCustomerMessageStatusService,
  sendCustomerMessageService,
} from "../services/customer-message-send.service";

/**
 * ============================================
 * SEND
 * ============================================
 */
export async function sendCustomerMessageAction(
  input: unknown,
) {
  // const user =
  //   await getCurrentUser();

  // if (!user) {
  //   return {
  //     success: false as const,
  //     message:
  //       "Authentication diperlukan.",
  //   };
  // }

  const parsed =
    sendCustomerMessageSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        parsed.error
          .issues[0]
          ?.message ??
        "Data tidak valid.",
    };
  }

  try {
    return await sendCustomerMessageService(
      parsed.data,
    );
  } catch (error) {
    console.error(
      "[Customer Message] Send:",
      error,
    );

    return {
      success: false as const,
      message:
        "Pesan gagal dimasukkan ke antrean.",
    };
  }
}

/**
 * ============================================
 * REALTIME DELIVERY STATUS
 * ============================================
 */
export async function getCustomerMessageStatusAction(
  input: unknown,
) {
  // const user =
  //   await getCurrentUser();

  // if (!user) {
  //   return {
  //     success: false as const,
  //     message:
  //       "Authentication diperlukan.",
  //   };
  // }

  const parsed =
    customerMessageStatusSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        "ID pesan tidak valid.",
    };
  }

  try {
    const status =
      await getCustomerMessageStatusService(
        parsed.data.messageIds,
      );

    return {
      success: true as const,
      status,
    };
  } catch (error) {
    console.error(
      "[Customer Message] Status:",
      error,
    );

    return {
      success: false as const,
      message:
        "Status pesan gagal dimuat.",
    };
  }
}