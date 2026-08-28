import type { MikroTikClient } from "@/services/mikrotik/client";

type RouterOSSystemResource = {
  uptime?: string;
  version?: string;
  "cpu-load"?: string;
  "cpu-count"?: string;
  cpu?: string;
  "free-memory"?: string;
  "total-memory"?: string;
  "free-hdd-space"?: string;
  "total-hdd-space"?: string;
  "board-name"?: string;
  "architecture-name"?: string;
  platform?: string;
};

function toNumber(value?: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function getMikroTikSystemResource(
  client: MikroTikClient,
) {
  const result = await client.write(
    "/system/resource/print",
  );

  const resource = result[0] as
    | RouterOSSystemResource
    | undefined;

  if (!resource) {
    throw new Error(
      "System resource MikroTik tidak tersedia",
    );
  }

  const totalMemory =
    toNumber(resource["total-memory"]);
  const freeMemory =
    toNumber(resource["free-memory"]);
  const totalStorage =
    toNumber(resource["total-hdd-space"]);
  const freeStorage =
    toNumber(resource["free-hdd-space"]);

  return {
    uptime: resource.uptime ?? "-",
    version: resource.version ?? "-",
    cpu: resource.cpu ?? "-",
    cpuCount: toNumber(
      resource["cpu-count"],
    ),
    cpuLoad: toNumber(
      resource["cpu-load"],
    ),
    totalMemory,
    freeMemory,
    usedMemory: Math.max(
      0,
      totalMemory - freeMemory,
    ),
    totalStorage,
    freeStorage,
    usedStorage: Math.max(
      0,
      totalStorage - freeStorage,
    ),
    boardName:
      resource["board-name"] ?? "-",
    architecture:
      resource["architecture-name"] ?? "-",
    platform:
      resource.platform ?? "-",
  };
}