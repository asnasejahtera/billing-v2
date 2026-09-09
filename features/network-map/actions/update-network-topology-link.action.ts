"use server";

import {
  updateNetworkTopologyLinkSchema,
  type UpdateNetworkTopologyLinkInput,
} from "../schemas/network-topology-link.schema";
import { updateNetworkTopologyLinkService } from "../services/network-topology-link.service";

export async function updateNetworkTopologyLinkAction(
  input: UpdateNetworkTopologyLinkInput,
) {
  const parsed =
    updateNetworkTopologyLinkSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        parsed.error.issues[0]?.message ??
        "Data fiber link tidak valid",
    };
  }

  try {
    const data =
      await updateNetworkTopologyLinkService(
        parsed.data,
      );

    return {
      success: true as const,
      message: "Fiber link berhasil diperbarui",
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui fiber link",
    };
  }
}