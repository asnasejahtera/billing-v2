import {
  parseInternetPlanListQuery,
  type InternetPlanListSearchParams,
} from "@/features/internet-plans/schemas/internet-plan-list.schema";
import {
  findInternetPlanById,
  listInternetPlans,
  updateInternetPlanLocalFields,
} from "@/features/internet-plans/repositories/internet-plan.repository";

import type { UpdateInternetPlanInput } from "@/features/internet-plans/schemas/update-internet-plan.schema";

export async function listInternetPlansService(
  params: InternetPlanListSearchParams,
) {
  const query =
    parseInternetPlanListQuery(
      params,
    );

  const result =
    await listInternetPlans(
      query,
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        result.total /
          query.pageSize,
      ),
    );

  return {
    ...result,
    ...query,
    totalPages,
  };
}

export class InternetPlanServiceError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "InternetPlanServiceError";
  }
}

export async function updateInternetPlanService(
  input: UpdateInternetPlanInput,
) {
  const existing =
    await findInternetPlanById(
      input.id,
    );

  if (!existing) {
    throw new InternetPlanServiceError(
      "Paket Internet tidak ditemukan",
    );
  }

  const result =
    await updateInternetPlanLocalFields(
      input.id,
      input.name,
      input.price,
    );

  if (!result) {
    throw new InternetPlanServiceError(
      "Paket Internet gagal diperbarui",
    );
  }

  return result;
}