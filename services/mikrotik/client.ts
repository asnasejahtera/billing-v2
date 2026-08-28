import { RouterOSAPI } from "node-routeros";
import type { MikroTikConnectionConfig } from "@/services/mikrotik/types";

export function createMikroTikClient(
  config: MikroTikConnectionConfig,
) {
  return new RouterOSAPI({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    timeout: config.timeout ?? 10,
    keepalive: false,
    tls: config.useTls
      ? {}
      : undefined,
  });
}

export type MikroTikClient =
  ReturnType<
    typeof createMikroTikClient
  >;