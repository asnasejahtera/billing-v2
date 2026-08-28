import { createMikroTikClient } from "@/services/mikrotik/client";
import { getMikroTikIdentity } from "@/services/mikrotik/resources/system/indentity";
import type { MikroTikConnectionConfig } from "@/services/mikrotik/types";

export async function testMikroTikConnection(
  config: MikroTikConnectionConfig,
) {
  const client =
    createMikroTikClient(config);

  try {
    await client.connect();

    const identity =
      await getMikroTikIdentity(
        client,
      );

    return identity;
  } finally {
    await client
      .close()
      .catch(() => undefined);
  }
}