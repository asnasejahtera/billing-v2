"use server";

import {
  createNetworkTopologyLinkSchema,
  type CreateNetworkTopologyLinkInput,
} from "../schemas/network-topology-link.schema";
import { createNetworkTopologyLinkService } from "../services/network-topology-link.service";

/*
 * =========================
 * CREATE NETWORK LINK
 * =========================
 */
export async function createNetworkTopologyLinkAction(
  input: CreateNetworkTopologyLinkInput,
) {
  const parsed =
    createNetworkTopologyLinkSchema.safeParse(input);

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
      await createNetworkTopologyLinkService(parsed.data);

    /*
     * Tidak memakai revalidatePath.
     * Runtime map akan diperbarui langsung
     * setelah INSERT berhasil.
     */
    return {
      success: true as const,
      message:
        `${data.sourceCode} → ${data.targetCode} berhasil dibuat`,
      data,
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat fiber link",
    };
  }
}