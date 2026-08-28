import type { MikroTikClient } from "@/services/mikrotik/client";
import type { MikroTikPppProfile } from "@/services/mikrotik/resources/ppp-profile/types";

export async function getMikroTikPppProfiles(
  client: MikroTikClient,
): Promise<MikroTikPppProfile[]> {
  const result = await client.write(
    "/ppp/profile/print",
    [
      "=.proplist=.id,name,comment,rate-limit,only-one,local-address,remote-address",
    ],
  );

  return result as MikroTikPppProfile[];
}