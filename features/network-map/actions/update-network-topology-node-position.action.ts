"use server";

import {
  updateNetworkTopologyNodePositionSchema,
  type UpdateNetworkTopologyNodePositionInput,
} from "../schemas/network-topology-node.schema";
import { updateNetworkMapNodePositionService } from "../services/network-topology-node.service";

export async function updateNetworkTopologyNodePositionAction(
  input: UpdateNetworkTopologyNodePositionInput,
) {
  const parsed =
    updateNetworkTopologyNodePositionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        parsed.error.issues[0]?.message ??
        "Posisi titik topology tidak valid",
    };
  }

  try {
    const data =
      await updateNetworkMapNodePositionService(parsed.data);

    return {
      success: true as const,
      message: "Posisi titik berhasil diperbarui",
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui posisi titik",
    };
  }
}