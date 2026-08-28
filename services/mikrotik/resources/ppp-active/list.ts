import type { MikroTikClient } from "@/services/mikrotik/client";
import type { MikroTikPppActive } from "./types";

export async function getMikroTikPppActive(
  client: MikroTikClient,
): Promise<MikroTikPppActive[]> {
  const result = await client.write(
    "/ppp/active/print",
    [
      "=.proplist=.id,name,address,caller-id,uptime,service",
    ],
  );

  return result as MikroTikPppActive[];
}