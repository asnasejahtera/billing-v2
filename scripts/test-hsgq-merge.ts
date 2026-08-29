import { createHash } from "node:crypto";

const baseUrl = "http://103.71.162.21:8080";
const username = "root";
const password = "kmzwa88saa";
const ponCount = 4;

interface HsgqLoginResponse {
  code: number;
  message: string;
}

interface HsgqResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface HsgqOnu {
  port_id: number;
  onu_id: number;
  onu_name: string;
  onu_desc: string;
  macaddr: string;
  status: string;
  auth_state: number;
  rtt: string;
  distance: number;
  onu_type: string;
  receive_power: string;
  dev_type: string;
  vendor: string;
  register_time: string;
  last_down_time: string;
  last_down_reason: string;
  parent: number;
}

interface HsgqPonMac {
  macaddr: string;
  vlan_id: number;
  port_id: number;
  onu_id: number;
  mac_type: number;
  onu_name: string;
}

function apiHeaders(token: string) {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: `${baseUrl}/`,
    "X-Token": token,
  };
}

async function login(): Promise<string> {
  const key = createHash("md5")
    .update(`${username}:${password}`)
    .digest("hex");

  const value = Buffer
    .from(password, "utf8")
    .toString("base64");

  const response = await fetch(
    `${baseUrl}/userlogin?form=login`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json;charset=UTF-8",
        "X-Token": "null",
        Origin: baseUrl,
        Referer: `${baseUrl}/`,
      },
      body: JSON.stringify({
        method: "set",
        param: {
          name: username,
          key,
          value,
          captcha_v: "",
          captcha_f: "",
        },
      }),
    },
  );

  const result =
    await response.json() as HsgqLoginResponse;

  if (result.code !== 1) {
    throw new Error(
      result.message || "Login HSGQ gagal",
    );
  }

  const token =
    response.headers.get("x-token");

  if (!token) {
    throw new Error(
      "X-Token tidak ditemukan",
    );
  }

  console.log("=== LOGIN SUCCESS ===");

  return token;
}

async function getOnusByPort(
  token: string,
  portId: number,
): Promise<HsgqOnu[]> {
  const url =
    `${baseUrl}/onu_allow_list` +
    `?port_id=${portId}` +
    `&t=${Date.now()}`;

  const response = await fetch(
    url,
    {
      method: "GET",
      headers: apiHeaders(token),
      cache: "no-store",
    },
  );

  const text =
    await response.text();

  if (!text.trim()) {
    throw new Error(
      `PON ${portId} mengembalikan response kosong`,
    );
  }

  const result =
    JSON.parse(text) as HsgqResponse<HsgqOnu[]>;

  if (result.code !== 1) {
    throw new Error(
      result.message ||
      `Gagal membaca PON ${portId}`,
    );
  }

  return result.data ?? [];
}

async function getAllOnus(
  token: string,
): Promise<HsgqOnu[]> {
  const allOnus: HsgqOnu[] = [];

  for (
    let portId = 1;
    portId <= ponCount;
    portId++
  ) {
    console.log(
      `Reading PON ${portId}...`,
    );

    try {
      const onus =
        await getOnusByPort(
          token,
          portId,
        );

      console.log(
        `PON ${portId}: ${onus.length} ONU`,
      );

      allOnus.push(...onus);
    } catch (error) {
      console.error(
        `PON ${portId} gagal:`,
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }

  return allOnus;
}

async function getPonMacTable(
  token: string,
): Promise<HsgqPonMac[]> {
  const url =
    `${baseUrl}/pon_mac_table` +
    `?t=${Date.now()}`;

  const response = await fetch(
    url,
    {
      method: "GET",
      headers: apiHeaders(token),
      cache: "no-store",
    },
  );

  const text =
    await response.text();

  if (!text.trim()) {
    throw new Error(
      "PON MAC table mengembalikan response kosong",
    );
  }

  const result =
    JSON.parse(text) as HsgqResponse<HsgqPonMac[]>;

  if (result.code !== 1) {
    throw new Error(
      result.message ||
      "Gagal membaca PON MAC table",
    );
  }

  return result.data ?? [];
}

function mergeOnuAndPonMac(
  onus: HsgqOnu[],
  ponMacs: HsgqPonMac[],
) {
  const macMap =
    new Map<string, HsgqPonMac[]>();

  for (const mac of ponMacs) {
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

  return onus.map((onu) => {
    const key =
      `${onu.port_id}:${onu.onu_id}`;

    return {
      ...onu,
      pon_macs:
        macMap.get(key) ?? [],
    };
  });
}

async function main() {
  const token =
    await login();

  console.log(
    "\n=== READ ONU ===",
  );

  const onus =
    await getAllOnus(token);

  console.log(
    "Total ONU:",
    onus.length,
  );

  console.log(
    "\n=== READ PON MAC ===",
  );

  const ponMacs =
    await getPonMacTable(token);

  console.log(
    "Total PON MAC:",
    ponMacs.length,
  );

  console.log(
    "\n=== MERGE ===",
  );

  const merged =
    mergeOnuAndPonMac(
      onus,
      ponMacs,
    );

  console.table(
    merged.map((onu) => ({
      ONU:
        `${onu.port_id}/${onu.onu_id}`,

      Name:
        onu.onu_name,

      ONU_MAC:
        onu.macaddr,

      PON_MAC:
        onu.pon_macs
          .map(
            (mac) =>
              mac.macaddr,
          )
          .join(", "),

      VLAN:
        onu.pon_macs
          .map(
            (mac) =>
              mac.vlan_id,
          )
          .join(", "),

      Status:
        onu.status,

      RX:
        `${onu.receive_power} dBm`,

      Distance:
        `${onu.distance} m`,
    })),
  );

  console.log(
    "\n=== TEST ALEX PON 1 ONU 5 ===",
  );

  const alex =
    merged.find(
      (onu) =>
        onu.port_id === 1 &&
        onu.onu_id === 5,
    );

  console.dir(
    alex,
    {
      depth: null,
    },
  );
}

main().catch((error) => {
  console.error(
    "\n=== ERROR ===",
    error,
  );
});