import type { MikroTikClient } from "@/services/mikrotik/client";

export type MikroTikPppProfileReference = {
  ".id"?: string;
  name?: string;
};

export async function findMikroTikPppProfileByName(
  client: MikroTikClient,
  name: string,
): Promise<MikroTikPppProfileReference | null> {
  const result =
    await client.write(
      "/ppp/profile/print",
      [
        `?name=${name}`,
        "=.proplist=.id,name",
      ],
    );

  return (
    result as MikroTikPppProfileReference[]
  )[0] ?? null;
}