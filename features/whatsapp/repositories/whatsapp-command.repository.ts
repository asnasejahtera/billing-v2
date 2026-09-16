import {
  and,
  eq,
  inArray,
} from "drizzle-orm";

import { db } from "@/db";
import {
  whatsappConnectionCommands,
  type WhatsAppConnectionCommandType,
} from "@/db/schema/whatsapp-connection-commands";

/**
 * ============================================
 * CONFIG
 * ============================================
 */
const CLIENT_KEY = "default";

/**
 * ============================================
 * CREATE COMMAND
 * ============================================
 */
export async function createWhatsAppConnectionCommand(
  command: WhatsAppConnectionCommandType,
) {
  /**
   * Jangan menumpuk LOGOUT/RECONNECT jika
   * command sebelumnya masih berjalan.
   */
  const [active] = await db
    .select({
      id: whatsappConnectionCommands.id,
      command:
        whatsappConnectionCommands.command,
      status:
        whatsappConnectionCommands.status,
    })
    .from(whatsappConnectionCommands)
    .where(
      and(
        eq(
          whatsappConnectionCommands.clientKey,
          CLIENT_KEY,
        ),
        inArray(
          whatsappConnectionCommands.status,
          [
            "PENDING",
            "PROCESSING",
          ],
        ),
      ),
    )
    .limit(1);

  if (active) {
    return {
      created: false as const,
      command: active,
    };
  }

  const [created] = await db
    .insert(
      whatsappConnectionCommands,
    )
    .values({
      clientKey: CLIENT_KEY,
      command,
      status: "PENDING",
    })
    .returning();

  if (!created) {
    throw new Error(
      "Command WhatsApp gagal dibuat.",
    );
  }

  return {
    created: true as const,
    command: created,
  };
}