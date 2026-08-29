import { eq } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";

export async function listCustomersForOltSyncRepository() {
  return db
    .select({
      id: customers.id,
      lastCallerId:
        customers.lastCallerId,
    })
    .from(customers);
}

export async function updateCustomerOltRepository(
  customerId: number,
  data: {
    onuPortId: number;
    onuId: number;
    onuName: string | null;
    onuMacAddress: string | null;
    onuPonMacAddress: string;
    onuVlanId: number | null;
    onuStatus: string | null;
    onuReceivePower: string | null;
    onuDistanceMeters: number | null;
    onuRtt: string | null;
    onuType: string | null;
    onuDeviceType: string | null;
    onuVendor: string | null;
    onuRegisterTime: string | null;
    onuLastDownTime: string | null;
    onuLastDownReason: string | null;
    onuMatchedAt: Date;
  },
) {
  await db
    .update(customers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      eq(
        customers.id,
        customerId,
      ),
    );
}