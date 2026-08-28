import type { MikroTikClient } from "@/services/mikrotik/client";
import type { MikroTikIdentity } from "@/services/mikrotik/types";

type RouterOSIdentityResponse = {
  name?: string;
};

export async function getMikroTikIdentity(
  client: MikroTikClient,
): Promise<MikroTikIdentity> {
  const result =
    await client.write(
      "/system/identity/print",
    );

  const identity =
    result[0] as
      | RouterOSIdentityResponse
      | undefined;

  if (!identity?.name) {
    throw new Error(
      "Identity RouterOS tidak ditemukan",
    );
  }

  return {
    name: identity.name,
  };
}