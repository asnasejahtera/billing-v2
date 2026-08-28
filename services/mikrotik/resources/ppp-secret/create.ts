import type { MikroTikClient } from "@/services/mikrotik/client";
import type {
  CreateMikroTikPppSecretInput,
  MikroTikPppSecret,
} from "./types";
import { findMikroTikPppSecretByName } from "./find";

export async function createMikroTikPppSecret(
  client: MikroTikClient,
  input: CreateMikroTikPppSecretInput,
): Promise<MikroTikPppSecret> {
  const words = [
    `=name=${input.name}`,
    `=password=${input.password}`,
    `=profile=${input.profile}`,
    `=service=${input.service ?? "pppoe"}`,
    `=disabled=${input.disabled ? "yes" : "no"}`,
  ];

  if (input.comment?.trim()) {
    words.push(
      `=comment=${input.comment.trim()}`,
    );
  }

  if (input.localAddress?.trim()) {
    words.push(
      `=local-address=${input.localAddress.trim()}`,
    );
  }

  if (input.remoteAddress?.trim()) {
    words.push(
      `=remote-address=${input.remoteAddress.trim()}`,
    );
  }

  await client.write(
    "/ppp/secret/add",
    words,
  );

  const created =
    await findMikroTikPppSecretByName(
      client,
      input.name,
    );

  if (!created) {
    throw new Error(
      "PPP Secret berhasil dikirim tetapi tidak ditemukan setelah pembuatan",
    );
  }

  return created;
}