import { asc, eq, inArray, or, desc, and, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  fiberCableCores,
  fiberCables,
  networkTopologyLinks,
  networkTopologyLinkWaypoints,
  networkTopologyNodes,
  fiberCoreConnections,
  networkTopologyPorts,
} from "@/db/schema";

const sourcePortAlias=alias(networkTopologyPorts,"source_port");
const targetPortAlias=alias(networkTopologyPorts,"target_port");

import {alias} from "drizzle-orm/pg-core";


import type { FiberCableCoreStatus } from "@/db/schema/fiber-cables";
/*
 * =========================
 * FIND NODE
 * =========================
 */
export async function findNetworkLinkNodeRepository(id: number) {
  const [row] = await db
    .select({
      id: networkTopologyNodes.id,
      code: networkTopologyNodes.code,
      latitude: networkTopologyNodes.latitude,
      longitude: networkTopologyNodes.longitude,
    })
    .from(networkTopologyNodes)
    .where(eq(networkTopologyNodes.id, id))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * CREATE FIBER CABLE
 * =========================
 */
export async function createFiberCableRepository(input: {
  name: string;
  cableType: string | null;
  fiberType: string | null;
  coreCount: number;
  sourceNodeId: number;
  targetNodeId: number;
  estimatedLengthMeters: string | null;
  actualLengthMeters: string | null;
  attenuationDbPerKm: string | null;
  description: string | null;
}) {
  const [created] = await db
    .insert(fiberCables)
    .values({
      name: input.name,
      cableType: input.cableType,
      fiberType: input.fiberType,
      coreCount: input.coreCount,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      estimatedLengthMeters: input.estimatedLengthMeters,
      actualLengthMeters: input.actualLengthMeters,
      attenuationDbPerKm: input.attenuationDbPerKm,
      status: "ACTIVE",
      description: input.description,
    })
    .returning();

  return created;
}

/*
 * =========================
 * CREATE TOPOLOGY LINK
 * =========================
 */
export async function createNetworkTopologyLinkRepository(input: {
  fiberCableId: number;
  routeLengthMeters: string;
  description: string | null;
}) {
  const [created] = await db
    .insert(networkTopologyLinks)
    .values({
      fiberCableId: input.fiberCableId,
      routeLengthMeters: input.routeLengthMeters,
      status: "ACTIVE",
      description: input.description,
    })
    .returning();

  return created;
}

/*
 * =========================
 * CREATE WAYPOINTS
 * =========================
 */
export async function createNetworkTopologyLinkWaypointsRepository(
  linkId: number,
  waypoints: Array<{
    sequence: number;
    latitude: string;
    longitude: string;
  }>,
) {
  if (waypoints.length === 0) return [];

  return db
    .insert(networkTopologyLinkWaypoints)
    .values(
      waypoints.map((waypoint) => ({
        linkId,
        sequence: waypoint.sequence,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
      })),
    )
    .returning();
}

/*
 * =========================
 * CLEANUP CREATE FAILURE
 * =========================
 */
export async function deleteNetworkTopologyLinkRepository(id: number) {
  await db
    .delete(networkTopologyLinks)
    .where(eq(networkTopologyLinks.id, id));
}

export async function deleteFiberCableRepository(id: number) {
  await db
    .delete(fiberCables)
    .where(eq(fiberCables.id, id));
}

/*
 * =========================
 * CREATE FIBER CORES
 * =========================
 */
export async function createFiberCableCoresRepository(
  cableId: number,
  cores: Array<{
    coreNumber: number;
    color: string;
  }>,
) {
  if (cores.length === 0) return [];

  const values: Array<{
    cableId: number;
    coreNumber: number;
    color: string;
    status: FiberCableCoreStatus;
  }> = cores.map((core) => ({
    cableId,
    coreNumber: core.coreNumber,
    color: core.color,
    status: "AVAILABLE",
  }));

  return db
    .insert(fiberCableCores)
    .values(values)
    .returning();
}

/*
 * =========================
 * LIST NETWORK LINKS
 * =========================
 */
export async function listNetworkTopologyLinksRepository() {
  return db
    .select({
      id: networkTopologyLinks.id,
      fiberCableId: networkTopologyLinks.fiberCableId,
      routeLengthMeters: networkTopologyLinks.routeLengthMeters,
      status: networkTopologyLinks.status,
      description: networkTopologyLinks.description,
      cableName: fiberCables.name,
      cableType: fiberCables.cableType,
      fiberType: fiberCables.fiberType,
      coreCount: fiberCables.coreCount,
      sourceNodeId: fiberCables.sourceNodeId,
      targetNodeId: fiberCables.targetNodeId,
      estimatedLengthMeters: fiberCables.estimatedLengthMeters,
      actualLengthMeters: fiberCables.actualLengthMeters,
      attenuationDbPerKm: fiberCables.attenuationDbPerKm,
    })
    .from(networkTopologyLinks)
    .innerJoin(
      fiberCables,
      eq(networkTopologyLinks.fiberCableId, fiberCables.id),
    )
    .orderBy(asc(networkTopologyLinks.id));
}

/*
 * =========================
 * LIST LINK WAYPOINTS
 * =========================
 */
export async function listNetworkTopologyLinkWaypointsRepository(
  linkIds: number[],
) {
  if (linkIds.length === 0) return [];

  return db
    .select({
      id: networkTopologyLinkWaypoints.id,
      linkId: networkTopologyLinkWaypoints.linkId,
      sequence: networkTopologyLinkWaypoints.sequence,
      latitude: networkTopologyLinkWaypoints.latitude,
      longitude: networkTopologyLinkWaypoints.longitude,
    })
    .from(networkTopologyLinkWaypoints)
    .where(
      inArray(
        networkTopologyLinkWaypoints.linkId,
        linkIds,
      ),
    )
    .orderBy(
      asc(networkTopologyLinkWaypoints.linkId),
      asc(networkTopologyLinkWaypoints.sequence),
    );
}

/*
 * =========================
 * FIND LINK ROUTE CONTEXT
 * =========================
 */
export async function findNetworkTopologyLinkRouteContextRepository(
  linkId: number,
) {
  const [row] = await db
    .select({
      id: networkTopologyLinks.id,
      routeLengthMeters: networkTopologyLinks.routeLengthMeters,
      sourceNodeId: fiberCables.sourceNodeId,
      targetNodeId: fiberCables.targetNodeId,
    })
    .from(networkTopologyLinks)
    .innerJoin(
      fiberCables,
      eq(
        networkTopologyLinks.fiberCableId,
        fiberCables.id,
      ),
    )
    .where(eq(networkTopologyLinks.id, linkId))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * DELETE LINK WAYPOINTS
 * =========================
 */
export async function deleteNetworkTopologyLinkWaypointsRepository(
  linkId: number,
) {
  await db
    .delete(networkTopologyLinkWaypoints)
    .where(
      eq(
        networkTopologyLinkWaypoints.linkId,
        linkId,
      ),
    );
}

/*
 * =========================
 * UPDATE ROUTE LENGTH
 * =========================
 */
export async function updateNetworkTopologyLinkRouteLengthRepository(
  linkId: number,
  routeLengthMeters: string,
) {
  const [updated] = await db
    .update(networkTopologyLinks)
    .set({
      routeLengthMeters,
      updatedAt: new Date(),
    })
    .where(eq(networkTopologyLinks.id, linkId))
    .returning({
      id: networkTopologyLinks.id,
    });

  return updated ?? null;
}

/*
 * =========================
 * FIND LINK EDIT DATA
 * =========================
 */
export async function findNetworkTopologyLinkEditRepository(
  linkId: number,
) {
  const [row] = await db
    .select({
      id: networkTopologyLinks.id,
      fiberCableId: networkTopologyLinks.fiberCableId,
      sourceNodeId: fiberCables.sourceNodeId,
      targetNodeId: fiberCables.targetNodeId,
      cableName: fiberCables.name,
      cableType: fiberCables.cableType,
      fiberType: fiberCables.fiberType,
      coreCount: fiberCables.coreCount,
      estimatedLengthMeters: fiberCables.estimatedLengthMeters,
      actualLengthMeters: fiberCables.actualLengthMeters,
      attenuationDbPerKm: fiberCables.attenuationDbPerKm,
      cableDescription: fiberCables.description,
      routeLengthMeters: networkTopologyLinks.routeLengthMeters,
      linkDescription: networkTopologyLinks.description,
    })
    .from(networkTopologyLinks)
    .innerJoin(
      fiberCables,
      eq(networkTopologyLinks.fiberCableId, fiberCables.id),
    )
    .where(eq(networkTopologyLinks.id, linkId))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * FIND CABLE BY NAME
 * =========================
 */
export async function findFiberCableByNameRepository(
  name: string,
) {
  const [row] = await db
    .select({
      id: fiberCables.id,
      name: fiberCables.name,
    })
    .from(fiberCables)
    .where(eq(fiberCables.name, name))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * UPDATE FIBER CABLE
 * =========================
 */
export async function updateFiberCableMetadataRepository(
  cableId: number,
  input: {
    name: string;
    cableType: string | null;
    fiberType: string | null;
    estimatedLengthMeters: string | null;
    actualLengthMeters: string | null;
    attenuationDbPerKm: string | null;
    description: string | null;
  },
) {
  const [updated] = await db
    .update(fiberCables)
    .set({
      name: input.name,
      cableType: input.cableType,
      fiberType: input.fiberType,
      estimatedLengthMeters: input.estimatedLengthMeters,
      actualLengthMeters: input.actualLengthMeters,
      attenuationDbPerKm: input.attenuationDbPerKm,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(eq(fiberCables.id, cableId))
    .returning({ id: fiberCables.id });

  return updated ?? null;
}

/*
 * =========================
 * UPDATE LINK METADATA
 * =========================
 */
export async function updateNetworkTopologyLinkMetadataRepository(
  linkId: number,
  description: string | null,
) {
  const [updated] = await db
    .update(networkTopologyLinks)
    .set({
      description,
      updatedAt: new Date(),
    })
    .where(eq(networkTopologyLinks.id, linkId))
    .returning({ id: networkTopologyLinks.id });

  return updated ?? null;
}

/*
 * =========================
 * FIND LINK DELETE CONTEXT
 * =========================
 */
export async function findNetworkTopologyLinkDeleteContextRepository(
  linkId: number,
) {
  const [row] = await db
    .select({
      id: networkTopologyLinks.id,
      fiberCableId: networkTopologyLinks.fiberCableId,
      cableName: fiberCables.name,
      sourceNodeId: fiberCables.sourceNodeId,
      targetNodeId: fiberCables.targetNodeId,
    })
    .from(networkTopologyLinks)
    .innerJoin(
      fiberCables,
      eq(networkTopologyLinks.fiberCableId, fiberCables.id),
    )
    .where(eq(networkTopologyLinks.id, linkId))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * FIND BLOCKING CORE
 * =========================
 * Proteksi jika status core menunjukkan
 * cable masih dipakai/reserved.
 */
export async function findBlockingFiberCableCoreRepository(
  cableId: number,
) {
  const [row] = await db
    .select({
      id: fiberCableCores.id,
      coreNumber: fiberCableCores.coreNumber,
      status: fiberCableCores.status,
    })
    .from(fiberCableCores)
    .where(
      and(
        eq(fiberCableCores.cableId, cableId),
        inArray(
          fiberCableCores.status,
          ["USED", "RESERVED"],
        ),
      ),
    )
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * FIND CORE CONNECTION HISTORY
 * =========================
 * Hard delete cable tidak boleh menghapus
 * history koneksi core secara diam-diam.
 */
export async function findFiberCableCoreConnectionRepository(
  cableId: number,
) {
  const [row] = await db
    .select({
      id: fiberCoreConnections.id,
      coreId: fiberCoreConnections.coreId,
      status: fiberCoreConnections.status,
      coreNumber: fiberCableCores.coreNumber,
    })
    .from(fiberCoreConnections)
    .innerJoin(
      fiberCableCores,
      eq(fiberCoreConnections.coreId, fiberCableCores.id),
    )
    .where(eq(fiberCableCores.cableId, cableId))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * DELETE FIBER CABLE
 * =========================
 * fiber_cables adalah physical parent.
 *
 * FK cascade:
 * cable → cores
 * cable → topology link
 * link → waypoints
 */
export async function deleteFiberCableWithTopologyRepository(
  cableId: number,
) {
  const [deleted] = await db
    .delete(fiberCables)
    .where(eq(fiberCables.id, cableId))
    .returning({
      id: fiberCables.id,
      name: fiberCables.name,
    });

  return deleted ?? null;
}


/*
 * =========================
 * AVAILABLE NODE PORTS
 * =========================
 */
export async function listAvailableNetworkNodePortsRepository(nodeId:number){
  return db.select({
    id:networkTopologyPorts.id,
    nodeId:networkTopologyPorts.nodeId,
    name:networkTopologyPorts.name,
    portNumber:networkTopologyPorts.portNumber,
    portType:networkTopologyPorts.portType,
    status:networkTopologyPorts.status,
  }).from(networkTopologyPorts).where(and(
    eq(networkTopologyPorts.nodeId,nodeId),
    eq(networkTopologyPorts.status,"AVAILABLE"),
  )).orderBy(asc(networkTopologyPorts.portNumber));
}
/*
 * =========================
 * AVAILABLE CABLE CORES
 * =========================
 */
export async function listAvailableFiberCableCoresRepository(cableId:number){
  return db.select({
    id:fiberCableCores.id,
    cableId:fiberCableCores.cableId,
    coreNumber:fiberCableCores.coreNumber,
    color:fiberCableCores.color,
    status:fiberCableCores.status,
  }).from(fiberCableCores).where(and(
    eq(fiberCableCores.cableId,cableId),
    eq(fiberCableCores.status,"AVAILABLE"),
  )).orderBy(asc(fiberCableCores.coreNumber));
}
/*
 * =========================
 * CONNECTION CONTEXT
 * =========================
 */
export async function findFiberConnectionContextRepository(linkId:number){
  const [row]=await db.select({
    linkId:networkTopologyLinks.id,
    fiberCableId:networkTopologyLinks.fiberCableId,
    sourceNodeId:fiberCables.sourceNodeId,
    targetNodeId:fiberCables.targetNodeId,
  }).from(networkTopologyLinks)
    .innerJoin(fiberCables,eq(networkTopologyLinks.fiberCableId,fiberCables.id))
    .where(eq(networkTopologyLinks.id,linkId)).limit(1);
  return row??null;
}

/*
 * =========================
 * FIND TOPOLOGY PORT
 * =========================
 */
export async function findNetworkTopologyPortRepository(portId:number){
  const [row]=await db.select({
    id:networkTopologyPorts.id,
    nodeId:networkTopologyPorts.nodeId,
    name:networkTopologyPorts.name,
    portNumber:networkTopologyPorts.portNumber,
    portType:networkTopologyPorts.portType,
    status:networkTopologyPorts.status,
  }).from(networkTopologyPorts).where(eq(networkTopologyPorts.id,portId)).limit(1);
  return row??null;
}

/*
 * =========================
 * FIND FIBER CORE
 * =========================
 */
export async function findFiberCableCoreRepository(coreId:number){
  const [row]=await db.select({
    id:fiberCableCores.id,
    cableId:fiberCableCores.cableId,
    coreNumber:fiberCableCores.coreNumber,
    color:fiberCableCores.color,
    status:fiberCableCores.status,
  }).from(fiberCableCores).where(eq(fiberCableCores.id,coreId)).limit(1);
  return row??null;
}

/*
 * =========================
 * ACTIVE CORE CONNECTION
 * =========================
 */
export async function findActiveFiberCoreConnectionRepository(input:{
  coreId?:number;
  sourcePortId?:number;
  targetPortId?:number;
}){
  const conditions=[];
  if(input.coreId) conditions.push(eq(fiberCoreConnections.coreId,input.coreId));
  if(input.sourcePortId) conditions.push(eq(fiberCoreConnections.sourcePortId,input.sourcePortId));
  if(input.targetPortId) conditions.push(eq(fiberCoreConnections.targetPortId,input.targetPortId));
  if(conditions.length===0) return null;

  const [row]=await db.select({
    id:fiberCoreConnections.id,
    coreId:fiberCoreConnections.coreId,
    sourcePortId:fiberCoreConnections.sourcePortId,
    targetPortId:fiberCoreConnections.targetPortId,
    status:fiberCoreConnections.status,
  }).from(fiberCoreConnections).where(and(
    eq(fiberCoreConnections.status,"ACTIVE"),
    or(...conditions),
  )).limit(1);

  return row??null;
}

/*
 * =========================
 * CREATE CORE CONNECTION
 * =========================
 */
export async function createFiberCoreConnectionRepository(input:{
  coreId:number;
  sourcePortId:number;
  targetPortId:number;
  description?:string|null;
}){
  const [created]=await db.insert(fiberCoreConnections).values({
    coreId:input.coreId,
    sourcePortId:input.sourcePortId,
    targetPortId:input.targetPortId,
    status:"ACTIVE",
    description:input.description??null,
  }).returning();
  return created;
}

/*
 * =========================
 * UPDATE PORT STATUS
 * =========================
 */
export async function updateNetworkTopologyPortStatusRepository(
  portId:number,
  status:"AVAILABLE"|"USED"|"RESERVED"|"DAMAGED"|"DISABLED",
){
  const [updated]=await db.update(networkTopologyPorts).set({
    status,
    updatedAt:new Date(),
  }).where(eq(networkTopologyPorts.id,portId)).returning({id:networkTopologyPorts.id});
  return updated??null;
}

/*
 * =========================
 * UPDATE CORE STATUS
 * =========================
 */
export async function updateFiberCableCoreStatusRepository(
  coreId:number,
  status:"AVAILABLE"|"USED",
){
  const [updated]=await db.update(fiberCableCores).set({
    status,
    updatedAt:new Date(),
  }).where(eq(fiberCableCores.id,coreId)).returning({id:fiberCableCores.id});
  return updated??null;
}

/*
 * =========================
 * DELETE NEW CONNECTION
 * =========================
 * Hanya untuk rollback create yang belum selesai.
 * Bukan operasi user release.
 */
export async function deleteFiberCoreConnectionRepository(id:number){
  const [deleted]=await db.delete(fiberCoreConnections)
    .where(eq(fiberCoreConnections.id,id))
    .returning({id:fiberCoreConnections.id});
  return deleted??null;
}

/*
 * =========================
 * ACTIVE FIBER CONNECTIONS
 * =========================
 */
export async function listActiveFiberCoreConnectionsRepository(cableId:number){
  return db.select({
    id:fiberCoreConnections.id,
    coreId:fiberCoreConnections.coreId,
    coreNumber:fiberCableCores.coreNumber,
    coreColor:fiberCableCores.color,
    sourcePortId:fiberCoreConnections.sourcePortId,
    sourcePortName:sourcePortAlias.name,
    sourceNodeId:sourcePortAlias.nodeId,
    targetPortId:fiberCoreConnections.targetPortId,
    targetPortName:targetPortAlias.name,
    targetNodeId:targetPortAlias.nodeId,
    status:fiberCoreConnections.status,
    description:fiberCoreConnections.description,
    connectedAt:fiberCoreConnections.connectedAt,
  }).from(fiberCoreConnections)
    .innerJoin(fiberCableCores,eq(fiberCoreConnections.coreId,fiberCableCores.id))
    .innerJoin(sourcePortAlias,eq(fiberCoreConnections.sourcePortId,sourcePortAlias.id))
    .innerJoin(targetPortAlias,eq(fiberCoreConnections.targetPortId,targetPortAlias.id))
    .where(and(
      eq(fiberCableCores.cableId,cableId),
      eq(fiberCoreConnections.status,"ACTIVE"),
    ))
    .orderBy(asc(fiberCableCores.coreNumber));
}

/*
 * =========================
 * CONNECTION DETAIL
 * =========================
 */
export async function findFiberCoreConnectionRepository(connectionId:number){
  const [row]=await db.select({
    id:fiberCoreConnections.id,
    coreId:fiberCoreConnections.coreId,
    cableId:fiberCableCores.cableId,
    coreNumber:fiberCableCores.coreNumber,
    coreColor:fiberCableCores.color,
    coreStatus:fiberCableCores.status,
    sourcePortId:fiberCoreConnections.sourcePortId,
    sourcePortName:sourcePortAlias.name,
    sourceNodeId:sourcePortAlias.nodeId,
    sourcePortStatus:sourcePortAlias.status,
    targetPortId:fiberCoreConnections.targetPortId,
    targetPortName:targetPortAlias.name,
    targetNodeId:targetPortAlias.nodeId,
    targetPortStatus:targetPortAlias.status,
    status:fiberCoreConnections.status,
    description:fiberCoreConnections.description,
    connectedAt:fiberCoreConnections.connectedAt,
  }).from(fiberCoreConnections)
    .innerJoin(fiberCableCores,eq(fiberCoreConnections.coreId,fiberCableCores.id))
    .innerJoin(sourcePortAlias,eq(fiberCoreConnections.sourcePortId,sourcePortAlias.id))
    .innerJoin(targetPortAlias,eq(fiberCoreConnections.targetPortId,targetPortAlias.id))
    .where(eq(fiberCoreConnections.id,connectionId))
    .limit(1);

  return row??null;
}

/*
 * =========================
 * OTHER ACTIVE USAGE
 * =========================
 */
export async function findOtherActiveFiberConnectionRepository(input:{
  connectionId:number;
  coreId:number;
  sourcePortId:number;
  targetPortId:number;
}){
  const [row]=await db.select({
    id:fiberCoreConnections.id,
  }).from(fiberCoreConnections).where(and(
    eq(fiberCoreConnections.status,"ACTIVE"),
    ne(fiberCoreConnections.id,input.connectionId),
    or(
      eq(fiberCoreConnections.coreId,input.coreId),
      eq(fiberCoreConnections.sourcePortId,input.sourcePortId),
      eq(fiberCoreConnections.targetPortId,input.targetPortId),
    ),
  )).limit(1);

  return row??null;
}

/*
 * =========================
 * RELEASE CONNECTION
 * =========================
 */
export async function releaseFiberCoreConnectionRepository(connectionId:number){
  const [updated]=await db.update(fiberCoreConnections).set({
    status:"RELEASED",
    releasedAt:new Date(),
    updatedAt:new Date(),
  }).where(and(
    eq(fiberCoreConnections.id,connectionId),
    eq(fiberCoreConnections.status,"ACTIVE"),
  )).returning({
    id:fiberCoreConnections.id,
    status:fiberCoreConnections.status,
    releasedAt:fiberCoreConnections.releasedAt,
  });

  return updated??null;
}