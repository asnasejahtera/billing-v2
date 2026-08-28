import { findRouterConnectionById } from "@/features/routers/repositories/router.repository";
import { decryptRouterPassword } from "@/features/routers/services/router-credential.service";
import { createMikroTikClient } from "@/services/mikrotik/client";
import {
  getMikroTikInterfaceTraffic,
  getMikroTikInterfaces,
} from "@/services/mikrotik/resources/interface/monitoring";
import { getMikroTikSystemResource } from "@/services/mikrotik/resources/system/resource";

export class RouterMonitoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouterMonitoringError";
  }
}

export async function getRouterMonitoringService(
  routerId: number,
  requestedInterface?: string,
) {
  const router =
    await findRouterConnectionById(
      routerId,
    );

  if (!router) {
    throw new RouterMonitoringError(
      "Router tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new RouterMonitoringError(
      "Router sedang nonaktif",
    );
  }

  const password =
    decryptRouterPassword(
      router.passwordEncrypted,
    );

  const client =
    createMikroTikClient({
      host: router.host,
      port: router.port,
      username: router.username,
      password,
      useTls: router.useHttps,
      timeout: 10,
    });

  try {
    await client.connect();

    const resource =
      await getMikroTikSystemResource(
        client,
      );

    const interfaces =
      await getMikroTikInterfaces(
        client,
      );

    const selected =
      interfaces.find(
        (item) =>
          item.name ===
          requestedInterface,
      ) ??
      interfaces.find(
        (item) => item.running,
      ) ??
      interfaces[0];

    if (!selected) {
      return {
        resource,
        interfaces: [],
        interface: null,
        updatedAt:
          new Date().toISOString(),
      };
    }

    const traffic =
      await getMikroTikInterfaceTraffic(
        client,
        selected.name,
      );

    return {
      resource,
      interfaces: interfaces.map(
        (item) => ({
          name: item.name,
          type: item.type,
          running: item.running,
        }),
      ),
      interface: {
        name: selected.name,
        type: selected.type,
        running: selected.running,
        totalRxBytes:
          selected.rxBytes,
        totalTxBytes:
          selected.txBytes,
        ...traffic,
      },
      updatedAt:
        new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `Monitoring router ${routerId}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    throw new RouterMonitoringError(
      "Gagal mengambil data monitoring MikroTik",
    );
  } finally {
    await client
      .close()
      .catch(() => undefined);
  }
}