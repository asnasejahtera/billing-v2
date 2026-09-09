"use server";

import { z } from "zod";
import { getNetworkTopologyLinkEditService } from "../services/network-topology-link.service";

const schema = z.object({
  id: z.number().int().positive(),
});

export async function getNetworkTopologyLinkEditAction(
  input: { id: number },
) {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "ID fiber link tidak valid",
    };
  }

  try {
    return {
      success: true as const,
      data:
        await getNetworkTopologyLinkEditService(
          parsed.data.id,
        ),
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengambil fiber link",
    };
  }
}