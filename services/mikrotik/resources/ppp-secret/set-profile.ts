import type { MikroTikClient } from "@/services/mikrotik/client";

export async function setMikroTikPppSecretProfile(
  client: MikroTikClient,
  secretId: string,
  profile: string,
) {
  await client.write(
    "/ppp/secret/set",
    [
      `=.id=${secretId}`,
      `=profile=${profile}`,
    ],
  );
}