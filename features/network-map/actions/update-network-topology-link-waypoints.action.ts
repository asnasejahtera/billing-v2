"use server";

import {
  updateNetworkTopologyLinkWaypointsSchema,
  type UpdateNetworkTopologyLinkWaypointsInput,
} from "../schemas/network-topology-link.schema";
import { updateNetworkTopologyLinkWaypointsService } from "../services/network-topology-link.service";

/*
 * =========================
 * UPDATE LINK WAYPOINTS
 * =========================
 */
export async function updateNetworkTopologyLinkWaypointsAction(
  input: UpdateNetworkTopologyLinkWaypointsInput,
) {
  const parsed =
    updateNetworkTopologyLinkWaypointsSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false as const,
      message:
        parsed.error.issues[0]?.message ??
        "Data waypoint tidak valid",
    };
  }

  try {
    const data =
      await updateNetworkTopologyLinkWaypointsService(
        parsed.data,
      );

    return {
      success: true as const,
      message:
        "Waypoint berhasil diperbarui",
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui waypoint",
    };
  }
}