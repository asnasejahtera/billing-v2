import type { MikroTikClient } from "@/services/mikrotik/client";

type RouterOSInterface = {
  name?: string;
  type?: string;
  running?: string;
  disabled?: string;
  dynamic?: string;
  "rx-byte"?: string;
  "tx-byte"?: string;
};

type RouterOSTraffic = {
  name?: string;
  "rx-bits-per-second"?: string;
  "tx-bits-per-second"?: string;
  "rx-packets-per-second"?: string;
  "tx-packets-per-second"?: string;
};

function toBoolean(value?: string) {
  return value === "true" || value === "yes";
}

function toNumber(value?: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function getMikroTikInterfaces(
  client: MikroTikClient,
) {
  const result = await client.write(
    "/interface/print",
    [
      "=.proplist=name,type,running,disabled,dynamic,rx-byte,tx-byte",
    ],
  );

  return (result as RouterOSInterface[])
    .filter(
      (item) =>
        item.name &&
        !toBoolean(item.disabled) &&
        !toBoolean(item.dynamic),
    )
    .map((item) => ({
      name: item.name!,
      type: item.type ?? "-",
      running: toBoolean(item.running),
      rxBytes: toNumber(
        item["rx-byte"],
      ),
      txBytes: toNumber(
        item["tx-byte"],
      ),
    }));
}

export async function getMikroTikInterfaceTraffic(
  client: MikroTikClient,
  interfaceName: string,
) {
  const result = await client.write(
    "/interface/monitor-traffic",
    [
      `=interface=${interfaceName}`,
      "=once=",
    ],
  );

  const traffic = result[0] as
    | RouterOSTraffic
    | undefined;

  if (!traffic) {
    throw new Error(
      "Traffic interface tidak tersedia",
    );
  }

  return {
    rxBps: toNumber(
      traffic[
        "rx-bits-per-second"
      ],
    ),
    txBps: toNumber(
      traffic[
        "tx-bits-per-second"
      ],
    ),
    rxPacketsPerSecond:
      toNumber(
        traffic[
          "rx-packets-per-second"
        ],
      ),
    txPacketsPerSecond:
      toNumber(
        traffic[
          "tx-packets-per-second"
        ],
      ),
  };
}