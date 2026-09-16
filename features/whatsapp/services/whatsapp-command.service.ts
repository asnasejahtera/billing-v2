import {
  createWhatsAppConnectionCommand,
} from "../repositories/whatsapp-command.repository";

import type {
  WhatsAppConnectionCommandType,
} from "@/db/schema/whatsapp-connection-commands";

/**
 * ============================================
 * REQUEST COMMAND
 * ============================================
 */
export async function requestWhatsAppConnectionCommandService(
  command: WhatsAppConnectionCommandType,
) {
  const result =
    await createWhatsAppConnectionCommand(
      command,
    );

  if (!result.created) {
    return {
      success: false,
      message:
        "Masih ada perintah WhatsApp yang sedang diproses.",
    };
  }

  return {
    success: true,
    message:
      command === "LOGOUT"
        ? "Permintaan logout dikirim."
        : "Permintaan reconnect dikirim.",
  };
}