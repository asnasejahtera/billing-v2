"use server";

import {
  updateNetworkTopologyNodeSchema,
  type UpdateNetworkTopologyNodeInput,
} from "../schemas/network-topology-node.schema";
import { updateNetworkMapNodeService } from "../services/network-topology-node.service";

/*
 * =========================
 * UPDATE NODE ACTION
 * =========================
 */
export async function updateNetworkTopologyNodeAction(
  input: UpdateNetworkTopologyNodeInput,
) {
  const parsed = updateNetworkTopologyNodeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        parsed.error.issues[0]?.message ??
        "Data titik topology tidak valid",
    };
  }

  try {
    const data = await updateNetworkMapNodeService(parsed.data);

    return {
      success: true as const,
      message: `${data.code} berhasil diperbarui`,
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui titik topology",
    };
  }
}