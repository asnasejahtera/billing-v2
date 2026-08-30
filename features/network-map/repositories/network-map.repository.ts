import { asc } from "drizzle-orm";

import { db } from "@/db";
import {
  networkTopologyNodes,
} from "@/db/schema/network-topology-nodes";

export async function findNetworkMapNodes() {
  return db
    .select({
      id: networkTopologyNodes.id,
      code: networkTopologyNodes.code,
      name: networkTopologyNodes.name,
      nodeType:
        networkTopologyNodes.nodeType,
      latitude:
        networkTopologyNodes.latitude,
      longitude:
        networkTopologyNodes.longitude,
      address:
        networkTopologyNodes.address,
      description:
        networkTopologyNodes.description,
    })
    .from(networkTopologyNodes)
    .orderBy(
      asc(networkTopologyNodes.name),
    );
}