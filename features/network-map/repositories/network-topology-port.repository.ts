import {and,asc,eq, sql, inArray} from "drizzle-orm";
import {db} from "@/db";
import {fiberDistributionDevices} from "@/db/schema/fiber-distribution-devices";
import {networkTopologyNodes} from "@/db/schema/network-topology-nodes";
import {
  networkTopologyPorts,
  type NetworkTopologyPortType,
} from "@/db/schema/network-topology-ports";
import {olts,oltPonPorts} from "@/db/schema/olts";

/*
 * =========================
 * NODE PORT CONTEXT
 * =========================
 */
export async function findNetworkTopologyPortContextRepository(nodeId:number){
  const [node]=await db.select({
    id:networkTopologyNodes.id,
    nodeType:networkTopologyNodes.nodeType,
    oltId:networkTopologyNodes.oltId,
    distributionDeviceId:networkTopologyNodes.distributionDeviceId,
  }).from(networkTopologyNodes).where(eq(networkTopologyNodes.id,nodeId)).limit(1);
  return node??null;
}

/*
 * =========================
 * OLT
 * =========================
 */
export async function findOltPortContextRepository(oltId:number){
  const [olt]=await db.select({
    id:olts.id,
    name:olts.name,
    ponCount:olts.ponCount,
  }).from(olts).where(eq(olts.id,oltId)).limit(1);
  return olt??null;
}

export async function ensureOltPonPortRepository(input:{
  oltId:number;
  ponNumber:number;
  name:string;
}){
  await db.insert(oltPonPorts).values({
    oltId:input.oltId,
    ponNumber:input.ponNumber,
    name:input.name,
  }).onConflictDoNothing({
    target:[oltPonPorts.oltId,oltPonPorts.ponNumber],
  });
}

export async function listOltPonPortsRepository(oltId:number){
  return db.select({
    id:oltPonPorts.id,
    oltId:oltPonPorts.oltId,
    ponNumber:oltPonPorts.ponNumber,
    name:oltPonPorts.name,
  }).from(oltPonPorts)
    .where(eq(oltPonPorts.oltId,oltId))
    .orderBy(asc(oltPonPorts.ponNumber));
}

/*
 * =========================
 * ODC / ODP
 * =========================
 */
export async function findDistributionPortContextRepository(deviceId:number){
  const [device]=await db.select({
    id:fiberDistributionDevices.id,
    name:fiberDistributionDevices.name,
    deviceType:fiberDistributionDevices.deviceType,
    portCapacity:fiberDistributionDevices.portCapacity,
    splitterType:fiberDistributionDevices.splitterType,
    splitterRatio:fiberDistributionDevices.splitterRatio,
  }).from(fiberDistributionDevices)
    .where(eq(fiberDistributionDevices.id,deviceId))
    .limit(1);
  return device??null;
}

/*
 * =========================
 * UPSERT TOPOLOGY PORT
 * =========================
 */
export async function upsertNetworkTopologyPortRepository(input:{
  nodeId:number;
  oltPonPortId?:number|null;
  portNumber:number;
  name:string;
  portType:NetworkTopologyPortType;
}){
  const [row]=await db.insert(networkTopologyPorts).values({
    nodeId:input.nodeId,
    oltPonPortId:input.oltPonPortId??null,
    portNumber:input.portNumber,
    name:input.name,
    portType:input.portType,
    status:"AVAILABLE",
  }).onConflictDoUpdate({
    target:[networkTopologyPorts.nodeId,networkTopologyPorts.portNumber],
    set:{
      oltPonPortId:input.oltPonPortId??null,
      name:input.name,
      portType:input.portType,
      updatedAt:new Date(),
    },
  }).returning();
  return row;
}

/*
 * =========================
 * NODE PORTS
 * =========================
 */
export async function listNetworkTopologyPortsByNodeRepository(nodeId:number){
  return db.select({
    id:networkTopologyPorts.id,
    nodeId:networkTopologyPorts.nodeId,
    oltPonPortId:networkTopologyPorts.oltPonPortId,
    portNumber:networkTopologyPorts.portNumber,
    name:networkTopologyPorts.name,
    portType:networkTopologyPorts.portType,
    status:networkTopologyPorts.status,
  }).from(networkTopologyPorts)
    .where(eq(networkTopologyPorts.nodeId,nodeId))
    .orderBy(asc(networkTopologyPorts.portNumber));
}

export async function listAvailableNetworkTopologyPortsByNodeRepository(nodeId:number){
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
 * NODE PORT SUMMARIES
 * =========================
 */
export async function listNetworkTopologyPortSummariesRepository(
  nodeIds:number[],
){
  if(nodeIds.length===0) return [];

  return db.select({
    nodeId:networkTopologyPorts.nodeId,

    inputTotal:sql<number>`
      count(*) filter (
        where ${networkTopologyPorts.portType}='INPUT'
      )
    `.mapWith(Number),

    inputAvailable:sql<number>`
      count(*) filter (
        where
          ${networkTopologyPorts.portType}='INPUT'
          and ${networkTopologyPorts.status}='AVAILABLE'
      )
    `.mapWith(Number),

    outputTotal:sql<number>`
      count(*) filter (
        where ${networkTopologyPorts.portType}='OUTPUT'
      )
    `.mapWith(Number),

    outputAvailable:sql<number>`
      count(*) filter (
        where
          ${networkTopologyPorts.portType}='OUTPUT'
          and ${networkTopologyPorts.status}='AVAILABLE'
      )
    `.mapWith(Number),

    ponTotal:sql<number>`
      count(*) filter (
        where ${networkTopologyPorts.portType}='PON'
      )
    `.mapWith(Number),

    ponAvailable:sql<number>`
      count(*) filter (
        where
          ${networkTopologyPorts.portType}='PON'
          and ${networkTopologyPorts.status}='AVAILABLE'
      )
    `.mapWith(Number),

    serviceTotal:sql<number>`
      count(*) filter (
        where ${networkTopologyPorts.portType}='SERVICE'
      )
    `.mapWith(Number),

    serviceAvailable:sql<number>`
      count(*) filter (
        where
          ${networkTopologyPorts.portType}='SERVICE'
          and ${networkTopologyPorts.status}='AVAILABLE'
      )
    `.mapWith(Number),
  })
  .from(networkTopologyPorts)
  .where(inArray(networkTopologyPorts.nodeId,nodeIds))
  .groupBy(networkTopologyPorts.nodeId);
}