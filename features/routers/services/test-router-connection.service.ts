import { decryptRouterPassword } from "@/features/routers/services/router-credential.service";
import { testMikroTikConnection } from "@/services/mikrotik/test-connection";
import {
  findRouterConnectionById,
  updateRouterConnectionStatus,
} from "@/features/routers/repositories/router.repository";

export class RouterConnectionError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "RouterConnectionError";
  }
}

export async function testRouterConnectionService(
  routerId: number,
) {
  const router =
    await findRouterConnectionById(
      routerId,
    );

  if (!router) {
    throw new RouterConnectionError(
      "Router tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new RouterConnectionError(
      "Router sedang nonaktif",
    );
  }

  const password =
    decryptRouterPassword(
      router.passwordEncrypted,
    );

  try {
    const identity =
      await testMikroTikConnection({
        host: router.host,
        port: router.port,
        username: router.username,
        password,
        useTls: router.useHttps,
        timeout: 10,
      });

    await updateRouterConnectionStatus(
      router.id,
      "ONLINE",
    );

    return {
      routerId: router.id,
      routerName: router.name,
      identity: identity.name,
    };
  } catch (error) {
    await updateRouterConnectionStatus(
      router.id,
      "OFFLINE",
    ).catch(() => undefined);

    console.error(
      `Router connection failed: ${router.id}`,
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    throw new RouterConnectionError(
      getRouterConnectionMessage(error),
    );
  }

}

function getRouterConnectionMessage(
  error: unknown,
) {
  if (!(error instanceof Error)) {
    return "Koneksi ke router gagal";
  }

  const message =
    error.message.toLowerCase();

  if (
    message.includes(
      "cannot log in",
    ) ||
    message.includes(
      "invalid user",
    ) ||
    message.includes(
      "cantlogin",
    )
  ) {
    return "Username atau password MikroTik tidak valid";
  }

  if (
    message.includes(
      "econnrefused",
    ) ||
    message.includes(
      "refused",
    )
  ) {
    return "Koneksi ditolak. Periksa IP, port, dan service API MikroTik";
  }

  if (
    message.includes(
      "timeout",
    ) ||
    message.includes(
      "etimedout",
    )
  ) {
    return "Koneksi ke MikroTik timeout";
  }

  if (
    message.includes(
      "ehostunreach",
    ) ||
    message.includes(
      "enetunreach",
    )
  ) {
    return "Router MikroTik tidak dapat dijangkau";
  }

  if (
    message.includes(
      "certificate",
    ) ||
    message.includes(
      "self-signed",
    )
  ) {
    return "Sertifikat API-SSL MikroTik tidak valid";
  }

  return "Gagal terhubung ke MikroTik";
}