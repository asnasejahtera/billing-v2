"use server";

import {
  createNetworkTopologyNodeSchema,
  type CreateNetworkTopologyNodeInput,
} from "../schemas/network-topology-node.schema";
import { createNetworkMapNodeService } from "../services/network-topology-node.service";


export type CreateNetworkTopologyNodeActionResult =
  | {
      success: true;
      message: string;
      data: Awaited<ReturnType<typeof createNetworkMapNodeService>>;
    }
  | {
      success: false;
      message: string;
    };

/*
 * =========================
 * CREATE TOPOLOGY NODE ACTION
 * =========================
 */
export async function createNetworkTopologyNodeAction(
  input: CreateNetworkTopologyNodeInput,
): Promise<CreateNetworkTopologyNodeActionResult> {
  const parsed = createNetworkTopologyNodeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ??
        "Data titik topology tidak valid",
    };
  }

  try {
    const created = await createNetworkMapNodeService(parsed.data);
    return {
      success: true,
      message: `${created.code} berhasil ditambahkan`,
      data: created,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menambahkan titik topology",
    };
  }
}