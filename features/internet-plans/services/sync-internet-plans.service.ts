import { findRouterConnectionById } from "@/features/routers/repositories/router.repository";
import { decryptRouterPassword } from "@/features/routers/services/router-credential.service";
import {
  markMissingInternetPlansInactive,
  upsertSyncedInternetPlan,
} from "@/features/internet-plans/repositories/internet-plan.repository";
import { mapMikroTikProfileToInternetPlan } from "@/features/internet-plans/services/map-mikrotik-profile";
import { createMikroTikClient } from "@/services/mikrotik/client";
import { getMikroTikPppProfiles } from "@/services/mikrotik/resources/ppp-profile/list";

export class InternetPlanSyncError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "InternetPlanSyncError";
  }
}

export async function syncInternetPlansFromRouterService(
  routerId: number,
) {
  const router =
    await findRouterConnectionById(
      routerId,
    );

  if (!router) {
    throw new InternetPlanSyncError(
      "Router tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new InternetPlanSyncError(
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
      username:
        router.username,
      password,
      useTls:
        router.useHttps,
      timeout: 10,
    });

  try {
    await client.connect();

    const profiles =
      await getMikroTikPppProfiles(
        client,
      );

    const mapped =
      profiles
        .map(
          mapMikroTikProfileToInternetPlan,
        )
        .filter(
          (
            plan,
          ): plan is NonNullable<
            typeof plan
          > => Boolean(plan),
        );

    for (const plan of mapped) {
      await upsertSyncedInternetPlan(
        routerId,
        plan,
      );
    }

    await markMissingInternetPlansInactive(
      routerId,
      mapped.map(
        (plan) =>
          plan.pppProfileName,
      ),
    );

    return {
      routerId,
      routerName:
        router.name,
      received:
        profiles.length,
      synced:
        mapped.length,
    };
  } catch (error) {
    console.error(
      `Internet plan sync router ${routerId}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    throw new InternetPlanSyncError(
      "Gagal sinkron paket dari MikroTik",
    );
  } finally {
    await client
      .close()
      .catch(() => undefined);
  }
}