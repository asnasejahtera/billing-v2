import type { MikroTikClient } from "@/services/mikrotik/client";
import type { MikroTikPppSecret } from "./types";

export async function getMikroTikPppSecrets(
  client: MikroTikClient,
): Promise<MikroTikPppSecret[]> {
  const result = await client.write(
    "/ppp/secret/print",
    [
      "=.proplist=.id,name,password,profile,comment,caller-id,local-address,remote-address,disabled,service",
    ],
  );

  return result as MikroTikPppSecret[];
}