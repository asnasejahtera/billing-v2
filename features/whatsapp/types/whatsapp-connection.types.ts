/**
 * ============================================
 * WHATSAPP CONNECTION STATUS
 * ============================================
 */
export type WhatsAppConnectionStatus =
  | "DISCONNECTED"
  | "STARTING"
  | "QR_REQUIRED"
  | "AUTHENTICATED"
  | "READY"
  | "ERROR";

/**
 * ============================================
 * CONNECTION SNAPSHOT
 * ============================================
 *
 * Aman dikirim ke Client Component.
 * Raw QR tidak termasuk di DTO ini.
 */
export type WhatsAppConnectionSnapshot = {
  registered: boolean;
  status: WhatsAppConnectionStatus;
  workerOnline: boolean;
  sessionName: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  workerInstance: string | null;
  lastError: string | null;
  lastHeartbeatAt: string | null;
  lastReadyAt: string | null;
  lastDisconnectedAt: string | null;
  qrAvailable: boolean;
  qrGeneratedAt: string | null;
  qrExpiresAt: string | null;
  qrVersion: string | null;
};