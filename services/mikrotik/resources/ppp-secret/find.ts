import type { MikroTikClient } from "@/services/mikrotik/client";
import type { MikroTikPppSecret } from "./types";

const PROPLIST =
  "=.proplist=.id,name,password,profile,comment,caller-id,local-address,remote-address,disabled,service";

export async function findMikroTikPppSecretByName(
  client: MikroTikClient,
  name: string,
): Promise<MikroTikPppSecret | null> {
  const result = await client.write(
    "/ppp/secret/print",
    [
      `?name=${name}`,
      PROPLIST,
    ],
  );

  return (
    result as MikroTikPppSecret[]
  )[0] ?? null;
}

export async function findMikroTikPppSecretById(
  client: MikroTikClient,
  id: string,
): Promise<MikroTikPppSecret | null> {
  const result = await client.write(
    "/ppp/secret/print",
    [
      `?.id=${id}`,
      PROPLIST,
    ],
  );

  return (
    result as MikroTikPppSecret[]
  )[0] ?? null;
}