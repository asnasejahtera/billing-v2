/**
 * ============================================
 * NORMALIZE WHATSAPP PHONE
 * ============================================
 *
 * Input:
 * 081234567890
 * 6281234567890
 * +6281234567890
 * 08 1234 5678 90
 *
 * Output:
 * 6281234567890
 */
export function normalizeWhatsAppPhone(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;

  /**
   * Hapus semua karakter selain angka.
   */
  let value = phone.replace(/\D/g, "");

  if (!value) return null;

  /**
   * Indonesia:
   * 08xxx -> 628xxx
   */
  if (value.startsWith("0")) {
    value = `62${value.slice(1)}`;
  }

  /**
   * Kadang tersimpan 8xxx tanpa 0/62.
   */
  if (value.startsWith("8")) {
    value = `62${value}`;
  }

  /**
   * Validasi dasar nomor Indonesia.
   *
   * 62 + nomor subscriber.
   */
  if (!/^628\d{7,12}$/.test(value)) {
    return null;
  }

  return value;
}

/**
 * ============================================
 * CHECK VALID
 * ============================================
 */
export function isValidWhatsAppPhone(
  phone: string | null | undefined,
): boolean {
  return normalizeWhatsAppPhone(phone) !== null;
}

/**
 * ============================================
 * WHATSAPP ID
 * ============================================
 *
 * whatsapp-web.js menggunakan:
 * 6281234567890@c.us
 */
export function toWhatsAppId(
  phone: string | null | undefined,
): string | null {
  const normalized =
    normalizeWhatsAppPhone(phone);

  if (!normalized) {
    return null;
  }

  return `${normalized}@c.us`;
}