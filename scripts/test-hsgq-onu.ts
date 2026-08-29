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
  console.log("Token:", token);

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

async function main() {
  const token =
    await login();

  const onus =
    await getAllOnus(token);

  console.log("\n=== SUMMARY ===");
  console.log(
    "Total ONU:",
    onus.length,
  );

  console.log(
    "Online:",
    onus.filter(
      (onu) =>
        onu.status.toLowerCase() ===
        "online",
    ).length,
  );

  console.log(
    "Offline:",
    onus.filter(
      (onu) =>
        onu.status.toLowerCase() !==
        "online",
    ).length,
  );

  console.log("\n=== ONU TABLE ===");

  console.table(
    onus.map((onu) => ({
      ONU: `${onu.port_id}/${onu.onu_id}`,
      Name: onu.onu_name,
      MAC: onu.macaddr,
      Status: onu.status,
      Auth:
        onu.auth_state === 1
          ? "Yes"
          : "No",
      RX: `${onu.receive_power} dBm`,
      RTT: onu.rtt,
      Distance: `${onu.distance} m`,
      Type: onu.onu_type,
      Device: onu.dev_type,
      Vendor: onu.vendor,
      LastDown: onu.last_down_reason,
    })),
  );
}

main().catch((error) => {
  console.error(
    "\n=== ERROR ===",
    error,
  );
});