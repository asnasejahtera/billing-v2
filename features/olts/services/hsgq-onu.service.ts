import { HsgqWebClient } from "@/services/olt/hsgq/web-client";
import type { HsgqOnuRaw } from "@/services/olt/hsgq/types";
import type {
  HsgqOnuDto,
  HsgqOnuListResult,
  HsgqOnuSummary,
  HsgqOnuRow,
} from "@/features/olts/types/hsgq-onu";

const HSGQ_URL = "http://103.71.162.21:8080";
const HSGQ_USERNAME = "root";
const HSGQ_PASSWORD = "kmzwa88saa";
const HSGQ_PON_COUNT = 4;

function toNumber(
  value: string | number | null | undefined,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : null;
}

function toNullableString(
  value: string | null | undefined,
): string | null {
  const result = value?.trim();

  return result || null;
}

function mapOnu(
  raw: HsgqOnuRaw,
): HsgqOnuDto {
  return {
    id: `${raw.port_id}/${raw.onu_id}`,
    portId: raw.port_id,
    onuId: raw.onu_id,
    name: raw.onu_name || "-",
    description: raw.onu_desc || "",
    macAddress: raw.macaddr || "-",
    status: raw.status || "Unknown",
    online:
      raw.status.toLowerCase() ===
      "online",
    authState:
      raw.auth_state === 1,
    rtt:
      toNumber(raw.rtt),
    distanceMeters:
      toNumber(raw.distance),
    onuType:
      raw.onu_type || "-",
    receivePowerDbm:
      toNumber(raw.receive_power),
    deviceType:
      raw.dev_type || "-",
    vendor:
      raw.vendor || "-",
    registerTime:
      toNullableString(
        raw.register_time,
      ),
    lastDownTime:
      toNullableString(
        raw.last_down_time,
      ),
    lastDownReason:
      raw.last_down_reason || "-",
  };
}

let client: HsgqWebClient | null = null;

function getClient() {
  if (!client) {
    client = new HsgqWebClient({
      baseUrl: HSGQ_URL,
      username: HSGQ_USERNAME,
      password: HSGQ_PASSWORD,
      timeout: 15_000,
    });
  }

  return client;
}


export async function listHsgqOnus(): Promise<HsgqOnuRow[]> {
  const client = getClient();

  const onuRows = await client.getAllOnus(
    HSGQ_PON_COUNT,
  );

  const macRows = await client.getPonMacTable();

  const macMap = new Map<
    string,
    HsgqOnuRow["ponMacs"]
  >();

  for (const mac of macRows) {
    const key = `${mac.port_id}:${mac.onu_id}`;
    const current = macMap.get(key) ?? [];

    current.push({
      macAddress: mac.macaddr,
      vlanId: mac.vlan_id,
      macType: mac.mac_type,
    });

    macMap.set(key, current);
  }

  return onuRows.map((raw) => {
    const onu = mapOnu(raw);
    const key = `${raw.port_id}:${raw.onu_id}`;

    return {
      ...onu,
      ponMacs: macMap.get(key) ?? [],
    };
  });
}

export async function listHsgqOnusByPort(
  portId: number,
): Promise<HsgqOnuDto[]> {
  const client = getClient();

  const rows =
    await client.getOnusByPort(
      portId,
    );

  return rows.map(mapOnu);
}

export async function getHsgqOnuSummary(): Promise<
  HsgqOnuSummary
> {
  const onus =
    await listHsgqOnus();

  const online =
    onus.filter(
      (onu) => onu.online,
    ).length;

  const powers =
    onus
      .map(
        (onu) =>
          onu.receivePowerDbm,
      )
      .filter(
        (
          power,
        ): power is number =>
          power !== null,
      );

  const averageRxPowerDbm =
    powers.length > 0
      ? powers.reduce(
          (sum, power) =>
            sum + power,
          0,
        ) / powers.length
      : null;

  return {
    total: onus.length,
    online,
    offline:
      onus.length - online,
    averageRxPowerDbm,
  };
}

export async function getHsgqOnuList(): Promise<
  HsgqOnuListResult
> {
  const data =
    await listHsgqOnus();

  const online =
    data.filter(
      (onu) => onu.online,
    ).length;

  const powers =
    data
      .map(
        (onu) =>
          onu.receivePowerDbm,
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );

  const averageRxPowerDbm =
    powers.length > 0
      ? powers.reduce(
          (sum, value) =>
            sum + value,
          0,
        ) / powers.length
      : null;

  return {
    data,
    summary: {
      total: data.length,
      online,
      offline:
        data.length - online,
      averageRxPowerDbm,
    },
  };
}

export async function getHsgqMergedRawData() {
  const client = getClient();

  const onuRows = await client.getAllOnus(
    HSGQ_PON_COUNT,
  );

  const macRows =
    await client.getPonMacTable();

  const macMap =
    new Map<string, typeof macRows>();

  for (const mac of macRows) {
    const key =
      `${mac.port_id}:${mac.onu_id}`;

    const current =
      macMap.get(key) ?? [];

    current.push(mac);

    macMap.set(
      key,
      current,
    );
  }

  return onuRows.map((onu) => {
    const key =
      `${onu.port_id}:${onu.onu_id}`;

    return {
      ...onu,
      pon_macs:
        macMap.get(key) ?? [],
    };
  });
}