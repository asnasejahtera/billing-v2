"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { authenticateUser } from "@/features/auth/services/auth.service";
import { createSession } from "@/features/auth/services/session.service";
import type { LoginActionState } from "@/features/auth/types/login-action-state";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validation = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return {
      message: "Periksa kembali data login",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const user = await authenticateUser(validation.data);

  if (!user) {
    return {
      message: "Email atau password salah",
    };
  }

  await createSession(user);

  redirect("/");
}