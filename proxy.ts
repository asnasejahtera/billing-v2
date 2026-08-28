import {
  NextRequest,
  NextResponse,
} from "next/server";
import { SESSION_COOKIE } from "@/features/auth/config/session";
import { verifySessionToken } from "@/features/auth/services/session-token.service";

export async function proxy(
  request: NextRequest,
) {
  const token =
    request.cookies.get(
      SESSION_COOKIE,
    )?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  const session =
    await verifySessionToken(token);

  if (!session) {
    const response =
      NextResponse.redirect(
        new URL("/login", request.url),
      );

    response.cookies.delete(
      SESSION_COOKIE,
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|.*\\..*).*)",
  ],
};