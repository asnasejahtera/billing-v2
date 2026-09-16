// import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWhatsAppConnectionSnapshotService } from "@/features/whatsapp/services/whatsapp-connection.service";

/**
 * ============================================
 * ROUTE CONFIG
 * ============================================
 */
export const dynamic = "force-dynamic";

/**
 * ============================================
 * GET CONNECTION STATUS
 * ============================================
 */
export async function GET() {
//   const user = await getCurrentUser();

//   if (!user) {
//     return Response.json(
//       {
//         success: false,
//         message: "Authentication diperlukan.",
//       },
//       {
//         status: 401,
//         headers: {
//           "Cache-Control":
//             "private, no-store, max-age=0",
//         },
//       },
//     );
//   }

  try {
    const data =
      await getWhatsAppConnectionSnapshotService();

    return Response.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      },
    );
  } catch {
    return Response.json(
      {
        success: false,
        message:
          "Status WhatsApp tidak dapat dibaca.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      },
    );
  }
}