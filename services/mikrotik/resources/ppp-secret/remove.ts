import type { MikroTikClient } from "@/services/mikrotik/client";

export async function removeMikroTikPppSecret(
  client: MikroTikClient,
  mikrotikId: string,
) {
  await client.write(
    "/ppp/secret/remove",
    [
      `=.id=${mikrotikId}`,
    ],
  );
}