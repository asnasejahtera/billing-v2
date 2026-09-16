"use server";

import {
  requestWhatsAppConnectionCommandService,
} from "../services/whatsapp-command.service";

// import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  sendWhatsAppTestMessageSchema,
} from "../schemas/send-test-message.schema";

import {
  createWhatsAppTestMessageService,
} from "../services/whatsapp-message.service";

/**
 * ============================================
 * LOGOUT
 * ============================================
 */
export async function logoutWhatsAppAction() {
//   const user =
//     await getCurrentUser();

//   if (!user) {
//     return {
//       success: false,
//       message:
//         "Authentication diperlukan.",
//     };
//   }

  try {
    return await requestWhatsAppConnectionCommandService(
      "LOGOUT",
    );
  } catch {
    return {
      success: false,
      message:
        "Permintaan logout gagal dibuat.",
    };
  }
}

/**
 * ============================================
 * RECONNECT
 * ============================================
 */
export async function reconnectWhatsAppAction() {
//   const user =
//     await getCurrentUser();

//   if (!user) {
//     return {
//       success: false,
//       message:
//         "Authentication diperlukan.",
//     };
//   }

  try {
    return await requestWhatsAppConnectionCommandService(
      "RECONNECT",
    );
  } catch {
    return {
      success: false,
      message:
        "Permintaan reconnect gagal dibuat.",
    };
  }
}

/**
 * ============================================
 * SEND TEST MESSAGE
 * ============================================
 */
export async function sendWhatsAppTestMessageAction(
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
    sendWhatsAppTestMessageSchema.safeParse(
      input,
    );

  if (
    !parsed.success
  ) {
    return {
      success:
        false as const,

      message:
        parsed.error
          .issues[0]
          ?.message ??
        "Data pesan tidak valid.",
    };
  }

  try {
    return await createWhatsAppTestMessageService(
      parsed.data,
    );
  } catch {
    return {
      success:
        false as const,

      message:
        "Pesan WhatsApp gagal dibuat.",
    };
  }
}