"use server";

import { z } from "zod";
import { deleteNetworkTopologyLinkService } from "../services/network-topology-link.service";

const deleteNetworkTopologyLinkSchema = z.object({
  id: z.number().int().positive(),
});

/*
 * =========================
 * DELETE FIBER LINK
 * =========================
 */
export async function deleteNetworkTopologyLinkAction(
  input: { id: number },
) {
  const parsed =
    deleteNetworkTopologyLinkSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false as const,
      message: "ID fiber link tidak valid",
    };
  }

  try {
    const data =
      await deleteNetworkTopologyLinkService(
        parsed.data.id,
      );

    return {
      success: true as const,
      message:
        `${data.cableName} berhasil dihapus`,
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus fiber link",
    };
  }
}