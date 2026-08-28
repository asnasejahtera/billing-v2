"use server";

import { redirect } from "next/navigation";
import { deleteSession } from "@/features/auth/services/session.service";

export async function logoutAction(): Promise<void> {
  await deleteSession();

  redirect("/login");
}