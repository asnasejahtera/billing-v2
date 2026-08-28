import { cache } from "react";
import { findUserById } from "@/features/auth/repositories/auth.repository";
import { getSession } from "@/features/auth/services/session.service";
import type { AuthenticatedUser } from "@/features/auth/services/auth.service";

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const session = await getSession();

    if (!session) {
      return null;
    }

    const user = await findUserById(
      session.userId,
    );

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
);