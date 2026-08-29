import { getHsgqMergedRawData } from "@/features/olts/services/hsgq-onu.service";

import {
  listCustomersForOltSyncRepository,
  updateCustomerOltRepository,
} from "@/features/customers/repositories/customer-olt.repository";

function normalizeMac(
  value: string | null | undefined,
) {
  if (!value) return "";

  return value
    .replace(/[^0-9a-f]/gi, "")
    .toLowerCase();
}

export async function syncCustomersFromOltService() {
  const [
    customerRows,
    onuRows,
  ] = await Promise.all([
    listCustomersForOltSyncRepository(),
    getHsgqMergedRawData(),
  ]);

  /*
   * Index berdasarkan pon_macs[0].
   *
   * Sesuai aturan:
   * - pon_macs kosong → skip
   * - hanya gunakan index 0
   */
  const onuByPonMac =
    new Map<
      string,
      (typeof onuRows)[number]
    >();

  let onuWithoutPonMac = 0;

  for (const onu of onuRows) {
    const ponMac =
      onu.pon_macs[0];

    if (!ponMac?.macaddr) {
      onuWithoutPonMac++;
      continue;
    }

    const normalized =
      normalizeMac(
        ponMac.macaddr,
      );

    if (!normalized) {
      continue;
    }

    onuByPonMac.set(
      normalized,
      onu,
    );
  }

  let updated = 0;
  let noCallerId = 0;
  let notMatched = 0;
  let failed = 0;

  for (const customer of customerRows) {
    if (!customer.lastCallerId) {
      noCallerId++;
      continue;
    }

    const callerId =
      normalizeMac(
        customer.lastCallerId,
      );

    if (!callerId) {
      noCallerId++;
      continue;
    }

    const onu =
      onuByPonMac.get(
        callerId,
      );

    if (!onu) {
      notMatched++;
      continue;
    }

    const ponMac =
      onu.pon_macs[0];

    if (!ponMac) {
      continue;
    }

    try {
      await updateCustomerOltRepository(
        customer.id,
        {
          onuPortId:
            onu.port_id,

          onuId:
            onu.onu_id,

          onuName:
            onu.onu_name || null,

          onuMacAddress:
            onu.macaddr || null,

          onuPonMacAddress:
            ponMac.macaddr,

          onuVlanId:
            ponMac.vlan_id ?? null,

          onuStatus:
            onu.status || null,

          onuReceivePower:
            onu.receive_power || null,

          onuDistanceMeters:
            Number.isFinite(
              Number(
                onu.distance,
              ),
            )
              ? Number(
                  onu.distance,
                )
              : null,

          onuRtt:
            onu.rtt || null,

          onuType:
            onu.onu_type || null,

          onuDeviceType:
            onu.dev_type || null,

          onuVendor:
            onu.vendor || null,

          onuRegisterTime:
            onu.register_time ||
            null,

          onuLastDownTime:
            onu.last_down_time ||
            null,

          onuLastDownReason:
            onu.last_down_reason ||
            null,

          onuMatchedAt:
            new Date(),
        },
      );

      updated++;
    } catch (error) {
      failed++;

      console.error(
        `OLT sync customer ${customer.id} gagal`,
        error,
      );
    }
  }

  return {
    totalCustomers:
      customerRows.length,

    totalOnus:
      onuRows.length,

    updated,

    noCallerId,

    notMatched,

    onuWithoutPonMac,

    failed,
  };
}