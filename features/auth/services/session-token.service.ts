import { jwtVerify, SignJWT } from "jose";
import { SESSION_DURATION_SECONDS } from "@/features/auth/config/session";
import type { AuthenticatedUser } from "@/features/auth/services/auth.service";
import type { SessionPayload } from "@/features/auth/types/session";

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET wajib dikonfigurasi minimal 32 karakter",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  user: AuthenticatedUser,
) {
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000,
  );

  const token = await new SignJWT({})
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(expiresAt.getTime() / 1000),
    )
    .sign(getSessionSecret());

  return {
    token,
    expiresAt,
  };
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
      },
    );

    const userId = Number(payload.sub);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return null;
    }

    return {
      userId,
    };
  } catch {
    return null;
  }
}