import QRCode from "qrcode";

// import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWhatsAppQrService } from "@/features/whatsapp/services/whatsapp-connection.service";

/**
 * ============================================
 * ROUTE CONFIG
 * ============================================
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * ============================================
 * GET QR IMAGE
 * ============================================
 */
export async function GET() {
//   const user = await getCurrentUser();

//   if (!user) {
//     return new Response(null, {
//       status: 401,
//       headers: {
//         "Cache-Control":
//           "private, no-store, max-age=0",
//       },
//     });
//   }

  try {
    const qr =
      await getWhatsAppQrService();

    if (!qr) {
      return new Response(null, {
        status: 404,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      });
    }

    /**
     * ========================================
     * SVG GENERATION
     * ========================================
     *
     * Browser hanya menerima gambar.
     * Raw WhatsApp QR tetap server-side.
     */
    const svg =
      await QRCode.toString(qr, {
        type: "svg",
        width: 320,
        margin: 1,
        errorCorrectionLevel: "M",
      });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type":
          "image/svg+xml; charset=utf-8",
        "Cache-Control":
          "private, no-store, max-age=0",
        "X-Content-Type-Options":
          "nosniff",
      },
    });
  } catch {
    return new Response(null, {
      status: 500,
      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",
      },
    });
  }
}