import "server-only";

import {asc,eq} from "drizzle-orm";
import {db} from "@/db";
import {networkTopologyNodes} from "@/db/schema/network-topology-nodes";
import {networkTopologyPorts} from "@/db/schema/network-topology-ports";
import {olts,oltPonPorts} from "@/db/schema/olts";

/*
 * =========================
 * OLT NODE
 * =========================
 */
export async function findOltTopologyNodeDetailRepository(nodeId:number){
  const [row]=await db.select({
    nodeId:networkTopologyNodes.id,
    code:networkTopologyNodes.code,
    name:networkTopologyNodes.name,
    nodeType:networkTopologyNodes.nodeType,
    status:networkTopologyNodes.status,
    latitude:networkTopologyNodes.latitude,
    longitude:networkTopologyNodes.longitude,
    address:networkTopologyNodes.address,
    description:networkTopologyNodes.description,

    oltId:olts.id,
    oltName:olts.name,
    brand:olts.brand,
    model:olts.model,
    ponCount:olts.ponCount,
    isActive:olts.isActive,
    oltDescription:olts.description,
  })
    .from(networkTopologyNodes)
    .innerJoin(
      olts,
      eq(networkTopologyNodes.oltId,olts.id),
    )
    .where(eq(networkTopologyNodes.id,nodeId))
    .limit(1);

  return row??null;
}

/*
 * =========================
 * PHYSICAL PON PORTS
 * =========================
 */
export async function listOltTopologyPonPortsRepository(oltId:number){
  return db.select({
    id:oltPonPorts.id,
    ponNumber:oltPonPorts.ponNumber,
    name:oltPonPorts.name,
    txPowerDbm:oltPonPorts.txPowerDbm,
    description:oltPonPorts.description,

    topologyPortId:networkTopologyPorts.id,
    topologyPortName:networkTopologyPorts.name,
    topologyPortStatus:networkTopologyPorts.status,
    measuredPowerDbm:networkTopologyPorts.measuredPowerDbm,
  })
    .from(oltPonPorts)
    .leftJoin(
      networkTopologyPorts,
      eq(networkTopologyPorts.oltPonPortId,oltPonPorts.id),
    )
    .where(eq(oltPonPorts.oltId,oltId))
    .orderBy(asc(oltPonPorts.ponNumber));
}