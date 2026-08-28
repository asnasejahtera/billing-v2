import { NextRequest } from "next/server";
import { getCurrentUser } from "@/features/auth/services/current-user.service";
import {
  getRouterMonitoringService,
  RouterMonitoringError,
} from "@/features/routers/services/router-monitoring.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const user =
    await getCurrentUser();

  if (!user) {
    return Response.json(
      {
        success: false,
        message:
          "Authentication diperlukan",
      },
      {
        status: 401,
      },
    );
  }

  const { id: idParam } =
    await context.params;

  const id = Number(idParam);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return Response.json(
      {
        success: false,
        message:
          "ID router tidak valid",
      },
      {
        status: 400,
      },
    );
  }

  const interfaceName =
    request.nextUrl.searchParams.get(
      "interface",
    ) ?? undefined;

  try {
    const data =
      await getRouterMonitoringService(
        id,
        interfaceName,
      );

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    if (
      error instanceof
      RouterMonitoringError
    ) {
      return Response.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 400,
        },
      );
    }

    console.error(
      "Router monitoring API:",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengambil monitoring router",
      },
      {
        status: 500,
      },
    );
  }
}