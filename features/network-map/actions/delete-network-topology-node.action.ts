"use server";

import { z } from "zod";
import { deleteNetworkMapNodeService } from "../services/network-topology-node.service";

const deleteNetworkTopologyNodeSchema = z.object({
  id: z.number().int().positive(),
});

/*
 * =========================
 * DELETE TOPOLOGY NODE
 * =========================
 */
export async function deleteNetworkTopologyNodeAction(
  input: { id: number },
) {
  const parsed =
    deleteNetworkTopologyNodeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "ID titik topology tidak valid",
    };
  }

  try {
    const data =
      await deleteNetworkMapNodeService(parsed.data.id);

    /*
     * Tidak memakai revalidatePath.
     * Map akan diperbarui langsung melalui engine.
     */
    return {
      success: true as const,
      message: `${data.code} berhasil dihapus`,
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus titik topology",
    };
  }
}