import {
  getWhatsAppMessageStatusService,
} from "@/features/whatsapp/services/whatsapp-message.service";

// import {
//   getCurrentUser,
// } from "@/lib/auth/get-current-user";

/**
 * ============================================
 * ROUTE CONFIG
 * ============================================
 */
export const dynamic =
  "force-dynamic";

/**
 * ============================================
 * GET MESSAGE STATUS
 * ============================================
 */
export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
//   const user =
//     await getCurrentUser();

//   if (!user) {
//     return Response.json(
//       {
//         success: false,
//         message:
//           "Authentication diperlukan.",
//       },
//       {
//         status: 401,
//       },
//     );
//   }

  const { id } =
    await context.params;

  const messageId =
    Number(id);

  if (
    !Number.isInteger(
      messageId,
    ) ||
    messageId <= 0
  ) {
    return Response.json(
      {
        success: false,
        message:
          "ID pesan tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  const message =
    await getWhatsAppMessageStatusService(
      messageId,
    );

  if (!message) {
    return Response.json(
      {
        success: false,
        message:
          "Pesan tidak ditemukan.",
      },
      {
        status: 404,
      },
    );
  }

  return Response.json(
    {
      success: true,
      data: {
        ...message,

        availableAt:
            message.availableAt
            .toISOString(),

        sentAt:
            message.sentAt
            ?.toISOString() ??
            null,
        },
    },
    
    {
      headers: {
        "Cache-Control":
          "private, no-store",
      },
    },
  );
}