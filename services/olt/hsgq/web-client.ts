
import { createHash } from "node:crypto";
import type {
  HsgqApiResponse,
  HsgqCurrentUser,
  HsgqOnuRaw,
  HsgqWebClientConfig,
  HsgqPonMacRaw,
  HsgqOnuDto,
  HsgqOnuListResult,
  HsgqOnuRow,
} from "./types";

export class HsgqWebClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private token: string | null = null;
  private loginPromise: Promise<string> | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(private readonly config: HsgqWebClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeout = config.timeout ?? 10_000;
  }

  private createLoginKey() {
    return createHash("md5")
      .update(`${this.config.username}:${this.config.password}`)
      .digest("hex");
  }

  private encodePassword() {
    return Buffer.from(
      this.config.password,
      "utf8",
    ).toString("base64");
  }

  private async parseJson<T>(
    response: Response,
    path: string,
  ): Promise<T> {
    const text = await response.text();

    if (!text.trim()) {
      throw new Error(
        `HSGQ mengembalikan response kosong dari ${path}`,
      );
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(
        `Response HSGQ dari ${path} bukan JSON valid`,
      );
    }
  }

 async login(): Promise<string> {
  if (this.token) {
    return this.token;
  }

  if (this.loginPromise) {
    return this.loginPromise;
  }

  this.loginPromise = this.performLogin();

  try {
    return await this.loginPromise;
  } finally {
    this.loginPromise = null;
  }
}

private async performLogin(): Promise<string> {
  const response = await fetch(
    `${this.baseUrl}/userlogin?form=login`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json;charset=UTF-8",
        "X-Token": "null",
        Origin: this.baseUrl,
        Referer: `${this.baseUrl}/`,
      },
      body: JSON.stringify({
        method: "set",
        param: {
          name: this.config.username,
          key: this.createLoginKey(),
          value: this.encodePassword(),
          captcha_v: "",
          captcha_f: "",
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(this.timeout),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Login HSGQ gagal HTTP ${response.status}`,
    );
  }

  const result = await this.parseJson<
    HsgqApiResponse<never>
  >(
    response,
    "/userlogin?form=login",
  );

  if (result.code !== 1) {
    throw new Error(
      result.message || "Login HSGQ gagal",
    );
  }

  const token =
    response.headers.get("x-token");

  if (!token) {
    throw new Error(
      "Login HSGQ berhasil tetapi X-Token tidak ditemukan",
    );
  }

  this.token = token;

  return token;
}

  private async getToken() {
      if (this.token) {
        return this.token;
      }

      return this.login();
    }

    invalidateToken() {
      this.token = null;
    }

    private isSessionExpired(
    result: HsgqApiResponse<unknown>,
  ): boolean {
    if (result.code === 1) {
      return false;
    }

    const message =
      result.message
        ?.trim()
        .toLowerCase() ?? "";

    return (
      message.includes("token") ||
      message.includes("session") ||
      message.includes("login") ||
      message.includes("expired") ||
      message.includes("unauthorized") ||
      message.includes("authentication")
    );
  }

  private async authenticatedGet<T>(
    path: string,
    retry = true,
  ): Promise<HsgqApiResponse<T>> {
    const token =
      await this.getToken();

    const response = await fetch(
      `${this.baseUrl}${path}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json, text/plain, */*",
          "Accept-Language":
            "en-US,en;q=0.9",
          Referer:
            `${this.baseUrl}/`,
          "X-Token": token,
        },
        cache: "no-store",
        signal:
          AbortSignal.timeout(
            this.timeout,
          ),
      },
    );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      if (!retry) {
        throw new Error(
          `Session HSGQ ditolak HTTP ${response.status}`,
        );
      }

      await this.relogin();

      return this.authenticatedGet<T>(
        path,
        false,
      );
    }

    if (!response.ok) {
      throw new Error(
        `HSGQ HTTP ${response.status} pada ${path}`,
      );
    }

    const text =
      await response.text();

    if (!text.trim()) {
      if (!retry) {
        throw new Error(
          `HSGQ mengembalikan response kosong dari ${path}`,
        );
      }

      await this.relogin();

      return this.authenticatedGet<T>(
        path,
        false,
      );
    }

    let result:
      HsgqApiResponse<T>;

    try {
      result =
        JSON.parse(
          text,
        ) as HsgqApiResponse<T>;
    } catch {
      throw new Error(
        `Response HSGQ dari ${path} bukan JSON valid`,
      );
    }

    if (
      this.isSessionExpired(
        result,
      )
    ) {
      if (!retry) {
        throw new Error(
          result.message ||
            "Session HSGQ sudah tidak valid",
        );
      }

      await this.relogin();

      return this.authenticatedGet<T>(
        path,
        false,
      );
    }

    return result;
  }

  async getCurrentUser(): Promise<HsgqCurrentUser> {
    const result =
      await this.authenticatedGet<HsgqCurrentUser>(
        "/usermgmt?form=userlevel",
      );

    if (
      result.code !== 1 ||
      !result.data
    ) {
      throw new Error(
        result.message ||
          "Gagal membaca user HSGQ",
      );
    }

    return result.data;
  }

  async getOnusByPort(
    portId: number,
  ): Promise<HsgqOnuRaw[]> {
    if (
      !Number.isInteger(portId) ||
      portId < 1
    ) {
      throw new Error(
        "portId HSGQ tidak valid",
      );
    }

    const query =
      new URLSearchParams({
        port_id: String(portId),
        t: String(Date.now()),
      });

    const result =
      await this.authenticatedGet<HsgqOnuRaw[]>(
        `/onu_allow_list?${query.toString()}`,
      );

    if (result.code !== 1) {
      throw new Error(
        result.message ||
          `Gagal membaca ONU PON ${portId}`,
      );
    }

    return Array.isArray(result.data)
      ? result.data
      : [];
  }

  async getAllOnus(
    ponCount: number,
  ): Promise<HsgqOnuRaw[]> {
    if (
      !Number.isInteger(ponCount) ||
      ponCount < 1
    ) {
      throw new Error(
        "Jumlah PON tidak valid",
      );
    }

    const result: HsgqOnuRaw[] = [];

    /*
     * Sengaja sequential.
     * Jangan bombardir web server embedded OLT
     * dengan Promise.all untuk seluruh PON.
     */
    for (
      let portId = 1;
      portId <= ponCount;
      portId++
    ) {
      const onus =
        await this.getOnusByPort(
          portId,
        );

      result.push(...onus);
    }

    return result;
  }

  private async relogin(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      this.invalidateToken();

      return this.login();
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async getOnuAllowList(): Promise<HsgqOnuRaw[]> {
  const query = new URLSearchParams({
    t: String(Date.now()),
  });

  const result = await this.authenticatedGet<HsgqOnuRaw[]>(
    `/onu_allow_list?${query.toString()}`,
  );

  if (result.code !== 1) {
    throw new Error(
      result.message || "Gagal membaca ONU list HSGQ",
    );
  }

  return Array.isArray(result.data) ? result.data : [];
}

  async getPonMacTable(): Promise<HsgqPonMacRaw[]> {
    const query = new URLSearchParams({
      t: String(Date.now()),
    });

    const result =
      await this.authenticatedGet<HsgqPonMacRaw[]>(
        `/pon_mac_table?${query.toString()}`,
      );

    if (result.code !== 1) {
      throw new Error(
        result.message ||
          "Gagal membaca PON MAC table HSGQ",
      );
    }

    return Array.isArray(result.data)
      ? result.data
      : [];
  }


}