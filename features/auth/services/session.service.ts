import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
} from "@/features/auth/config/session";
import type { AuthenticatedUser } from "@/features/auth/services/auth.service";
import {
  createSessionToken,
  verifySessionToken,
} from "@/features/auth/services/session-token.service";

export async function createSession(
  user: AuthenticatedUser,
) {
  const { token, expiresAt } =
    await createSessionToken(user);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}