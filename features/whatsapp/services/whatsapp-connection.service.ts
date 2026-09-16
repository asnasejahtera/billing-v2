import {
  findWhatsAppConnectionOverview,
  findWhatsAppQrPayload,
} from "../repositories/whatsapp-connection.repository";

import type {
  WhatsAppConnectionSnapshot,
} from "../types/whatsapp-connection.types";

/**
 * ============================================
 * WORKER HEALTH
 * ============================================
 *
 * Heartbeat worker dikirim setiap 60 detik.
 * Setelah 2 menit tanpa heartbeat dianggap offline.
 */
const HEARTBEAT_TIMEOUT_MS = 120_000;

/**
 * ============================================
 * DATE HELPER
 * ============================================
 */
function toIso(
  value: Date | null,
) {
  return value?.toISOString() ?? null;
}

/**
 * ============================================
 * CONNECTION SNAPSHOT
 * ============================================
 */
export async function getWhatsAppConnectionSnapshotService(): Promise<WhatsAppConnectionSnapshot> {
  const connection =
    await findWhatsAppConnectionOverview();

  if (!connection) {
    return {
      registered: false,
      status: "DISCONNECTED",
      workerOnline: false,
      sessionName: null,
      phoneNumber: null,
      displayName: null,
      workerInstance: null,
      lastError: null,
      lastHeartbeatAt: null,
      lastReadyAt: null,
      lastDisconnectedAt: null,
      qrAvailable: false,
      qrGeneratedAt: null,
      qrExpiresAt: null,
      qrVersion: null,
    };
  }

  const now = Date.now();

  const workerOnline =
    connection.lastHeartbeatAt !== null &&
    now - connection.lastHeartbeatAt.getTime() <=
      HEARTBEAT_TIMEOUT_MS;

  const qrAvailable =
    connection.status === "QR_REQUIRED" &&
    connection.qrExpiresAt !== null &&
    connection.qrGeneratedAt !== null &&
    connection.qrExpiresAt.getTime() > now;

  return {
    registered: true,
    status: connection.status,
    workerOnline,
    sessionName: connection.sessionName,
    phoneNumber: connection.phoneNumber,
    displayName: connection.displayName,
    workerInstance: connection.workerInstance,
    lastError: connection.lastError,
    lastHeartbeatAt: toIso(connection.lastHeartbeatAt),
    lastReadyAt: toIso(connection.lastReadyAt),
    lastDisconnectedAt: toIso(connection.lastDisconnectedAt),
    qrAvailable,
    qrGeneratedAt: toIso(connection.qrGeneratedAt),
    qrExpiresAt: toIso(connection.qrExpiresAt),
    qrVersion:
      qrAvailable && connection.qrGeneratedAt
        ? String(connection.qrGeneratedAt.getTime())
        : null,
  };
}

/**
 * ============================================
 * CURRENT QR
 * ============================================
 *
 * Raw QR tidak pernah diteruskan ke Client Component.
 */
export async function getWhatsAppQrService() {
  const connection =
    await findWhatsAppQrPayload();

  if (
    !connection ||
    connection.status !== "QR_REQUIRED" ||
    !connection.qrCode ||
    !connection.qrExpiresAt
  ) {
    return null;
  }

  if (
    connection.qrExpiresAt.getTime() <=
    Date.now()
  ) {
    return null;
  }

  return connection.qrCode;
}