import type { MikroTikClient } from "@/services/mikrotik/client";

export type UpdateMikroTikPppSecretInput = {
  id: string;
  name: string;
  password: string;
  profile: string;
  comment?: string | null;
  localAddress?: string | null;
  remoteAddress?: string | null;
  disabled?: boolean;
};

export async function updateMikroTikPppSecret(
  client: MikroTikClient,
  input: UpdateMikroTikPppSecretInput,
): Promise<void> {
  const id = input.id.trim();
  const name = input.name.trim();
  const password = input.password;
  const profile = input.profile.trim();

  if (!id) {
    throw new Error(
      "PPP Secret ID MikroTik tidak tersedia",
    );
  }

  if (!name) {
    throw new Error(
      "PPPoE User wajib diisi",
    );
  }

  if (!profile) {
    throw new Error(
      "PPP Profile wajib diisi",
    );
  }

  const words: string[] = [
    `=.id=${id}`,
    `=name=${name}`,
    `=password=${password}`,
    `=profile=${profile}`,
  ];

  /*
   * Comment boleh kosong.
   */
  if (
    input.comment !==
    undefined
  ) {
    words.push(
      `=comment=${input.comment ?? ""}`,
    );
  }

  /*
   * Jangan kirim:
   *
   * =local-address=
   *
   * karena beberapa kondisi RouterOS
   * akan menolaknya sebagai value invalid.
   */
  if (
    input.localAddress &&
    input.localAddress.trim()
  ) {
    words.push(
      `=local-address=${input.localAddress.trim()}`,
    );
  }

  /*
   * Sama untuk remote-address.
   */
  if (
    input.remoteAddress &&
    input.remoteAddress.trim()
  ) {
    words.push(
      `=remote-address=${input.remoteAddress.trim()}`,
    );
  }

  if (
    typeof input.disabled ===
    "boolean"
  ) {
    words.push(
      `=disabled=${input.disabled ? "yes" : "no"}`,
    );
  }

  await client.write(
    "/ppp/secret/set",
    words,
  );
}