import { findRouterConnectionById } from "@/features/routers/repositories/router.repository";
import { decryptRouterPassword } from "@/features/routers/services/router-credential.service";
import {
  listExistingCustomersByRouter,
  listInternetPlanMapByRouter,
  upsertSyncedCustomer,
} from "@/features/customers/repositories/customer.repository";
import { parseRouterOsUptimeSeconds } from "@/features/customers/services/parse-routeros-uptime";
import { createMikroTikClient } from "@/services/mikrotik/client";
import { getMikroTikPppActive } from "@/services/mikrotik/resources/ppp-active/list";
import { getMikroTikPppSecrets } from "@/services/mikrotik/resources/ppp-secret/list";

export class CustomerSyncError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "CustomerSyncError";
  }
}

export async function syncCustomersFromRouterService(
  routerId: number,
) {
  const router =
    await findRouterConnectionById(
      routerId,
    );

  if (!router) {
    throw new CustomerSyncError(
      "Router tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new CustomerSyncError(
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
      timeout: 15,
    });

  try {
    await client.connect();

    const secrets =
      await getMikroTikPppSecrets(
        client,
      );

    const activeUsers =
      await getMikroTikPppActive(
        client,
      );

    const plans =
      await listInternetPlanMapByRouter(
        routerId,
      );

    const existingCustomers =
      await listExistingCustomersByRouter(
        routerId,
      );

    const planMap =
      new Map(
        plans.map(
          (plan) => [
            plan.profileName,
            plan.id,
          ],
        ),
      );

    const activeMap =
      new Map(
        activeUsers
          .filter(
            (active) =>
              active.name,
          )
          .map(
            (active) => [
              active.name!,
              active,
            ],
          ),
      );

    const customerMap =
      new Map(
        existingCustomers.map(
          (customer) => [
            customer.pppoeUsername,
            customer,
          ],
        ),
      );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const skippedProfiles =
      new Set<string>();

    const now = new Date();

    for (
      const secret
      of secrets
    ) {
      const username =
        secret.name?.trim();

      if (!username) {
        skipped++;
        continue;
      }

      const profileName =
        secret.profile?.trim() ||
        "default";

      const internetPlanId =
        planMap.get(
          profileName,
        );

      /*
       * Customer tidak boleh dibuat
       * tanpa Internet Plan.
       */
      if (!internetPlanId) {
        skipped++;

        skippedProfiles.add(
          profileName,
        );

        continue;
      }

      const active =
        activeMap.get(
          username,
        );

      const existing =
        customerMap.get(
          username,
        );

      const isOnline =
        Boolean(active);

      const uptime =
        active?.uptime?.trim() ||
        null;

      const uptimeSeconds =
        isOnline
          ? parseRouterOsUptimeSeconds(
              uptime ?? undefined,
            )
          : null;

      /*
       * RouterOS /ppp secret tidak
       * menyediakan last-login.
       *
       * Jika sedang aktif:
       *
       * start session =
       * sekarang - uptime
       */
      const lastLoginAt =
        isOnline &&
        uptimeSeconds !== null
          ? new Date(
              now.getTime() -
                uptimeSeconds *
                  1000,
            )
          : existing?.lastLoginAt ??
            null;

      /*
       * Online pada sync sebelumnya,
       * sekarang tidak ada di
       * /ppp active:
       * anggap logout terjadi antara
       * dua sync tersebut.
       */
      const lastLogoutAt =
        existing?.isOnline &&
        !isOnline
          ? now
          : existing
              ?.lastLogoutAt ??
            null;

      /*
       * Actual caller-id saat online
       * diprioritaskan.
       */
      const lastCallerId =
        active?.[
          "caller-id"
        ]?.trim() ||
        secret[
          "caller-id"
        ]?.trim() ||
        existing
          ?.lastCallerId ||
        null;

      const result =
        await upsertSyncedCustomer({
          routerId,
          internetPlanId,

          name:
            secret.comment?.trim() ||
            username,

          pppoeUsername:
            username,

          // Plain text sesuai requirement.
          pppoePassword:
            secret.password ?? "",

          pppProfileName:
            profileName,

          ipAddress:
            active?.address?.trim() ||
            null,

          localAddress:
            secret[
              "local-address"
            ]?.trim() ||
            null,

          remoteAddress:
            secret[
              "remote-address"
            ]?.trim() ||
            null,

          isOnline,

          uptime,

          uptimeSeconds,

          lastCallerId,

          lastLoginAt,

          lastLogoutAt,

          mikrotikRef:
            secret[".id"] ??
            null,
        });

      if (result.created) {
        created++;
      } else {
        updated++;
      }
    }

    return {
      routerId,
      routerName:
        router.name,
      secrets:
        secrets.length,
      online:
        activeUsers.length,
      created,
      updated,
      skipped,
      skippedProfiles: [
        ...skippedProfiles,
      ],
    };
  } catch (error) {
    if (
      error instanceof
      CustomerSyncError
    ) {
      throw error;
    }

    console.error(
      `Customer sync router ${routerId}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    throw new CustomerSyncError(
      "Gagal sinkron Customer dari MikroTik",
    );
  } finally {
    await client
      .close()
      .catch(() => undefined);
  }
}