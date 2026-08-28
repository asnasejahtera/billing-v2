import { compare } from "bcryptjs";
import { findUserByEmail } from "@/features/auth/repositories/auth.repository";
import type { LoginInput } from "@/features/auth/schemas/login.schema";

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
};

export async function authenticateUser(
  input: LoginInput,
): Promise<AuthenticatedUser | null> {
  const user = await findUserByEmail(input.email);

  if (!user || !user.isActive) {
    return null;
  }

  const passwordValid = await compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}