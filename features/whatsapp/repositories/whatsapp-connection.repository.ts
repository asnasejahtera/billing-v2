import { eq } from "drizzle-orm";

import { db } from "@/db";
import { whatsappConnections } from "@/db/schema/whatsapp";

/**
 * ============================================
 * CONNECTION CONFIG
 * ============================================
 */
const CLIENT_KEY = "default";

/**
 * ============================================
 * CONNECTION OVERVIEW
 * ============================================
 *
 * Raw QR sengaja tidak dipilih.
 */
export async function findWhatsAppConnectionOverview() {
  const [connection] = await db
    .select({
      id: whatsappConnections.id,
      clientKey: whatsappConnections.clientKey,
      sessionName: whatsappConnections.sessionName,
      status: whatsappConnections.status,
      phoneNumber: whatsappConnections.phoneNumber,
      displayName: whatsappConnections.displayName,
      workerInstance: whatsappConnections.workerInstance,
      lastError: whatsappConnections.lastError,
      lastHeartbeatAt: whatsappConnections.lastHeartbeatAt,
      lastReadyAt: whatsappConnections.lastReadyAt,
      lastDisconnectedAt: whatsappConnections.lastDisconnectedAt,
      qrGeneratedAt: whatsappConnections.qrGeneratedAt,
      qrExpiresAt: whatsappConnections.qrExpiresAt,
    })
    .from(whatsappConnections)
    .where(eq(whatsappConnections.clientKey, CLIENT_KEY))
    .limit(1);

  return connection ?? null;
}

/**
 * ============================================
 * QR PAYLOAD
 * ============================================
 *
 * Hanya digunakan server-side oleh QR endpoint.
 */
export async function findWhatsAppQrPayload() {
  const [connection] = await db
    .select({
      status: whatsappConnections.status,
      qrCode: whatsappConnections.qrCode,
      qrGeneratedAt: whatsappConnections.qrGeneratedAt,
      qrExpiresAt: whatsappConnections.qrExpiresAt,
    })
    .from(whatsappConnections)
    .where(eq(whatsappConnections.clientKey, CLIENT_KEY))
    .limit(1);

  return connection ?? null;
}