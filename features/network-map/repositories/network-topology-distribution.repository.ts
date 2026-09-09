import {eq, asc, and, or, inArray} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {db} from "@/db";
import {
  fiberDistributionDevices,
  type FiberDistributionDeviceType,
} from "@/db/schema/fiber-distribution-devices";
import {networkTopologyNodes} from "@/db/schema/network-topology-nodes";
import {
  networkTopologyPorts,
  type NewNetworkTopologyPort,
} from "@/db/schema/network-topology-ports";

import {fiberCableCores,fiberCables} from "@/db/schema/fiber-cables";
import {fiberCoreConnections} from "@/db/schema/fiber-core-connections";

const sourcePort=alias(networkTopologyPorts,"distribution_source_port");
const targetPort=alias(networkTopologyPorts,"distribution_target_port");
const sourceNode=alias(networkTopologyNodes,"distribution_source_node");
const targetNode=alias(networkTopologyNodes,"distribution_target_node");
/*
 * =========================
 * CREATE DISTRIBUTION DEVICE
 * =========================
 */
export async function createDistributionDeviceRepository(input:{
  name:string;
  deviceType:FiberDistributionDeviceType;
  portCapacity:number;
  description:string|null;
}){
  const [row]=await db.insert(fiberDistributionDevices).values({
    name:input.name,
    deviceType:input.deviceType,
    portCapacity:input.portCapacity,
    splitterType:"RATIO",
    splitterRatio:`1:${input.portCapacity}`,
    description:input.description,
  }).returning();
  return row;
}

/*
 * =========================
 * CREATE TOPOLOGY NODE
 * =========================
 */
export async function createDistributionTopologyNodeRepository(input:{
  code:string;
  name:string;
  nodeType:"ODC"|"ODP";
  latitude:string;
  longitude:string;
  distributionDeviceId:number;
  address:string|null;
  description:string|null;
}){
  const [row]=await db.insert(networkTopologyNodes).values({
    code:input.code,
    name:input.name,
    nodeType:input.nodeType,
    latitude:input.latitude,
    longitude:input.longitude,
    distributionDeviceId:input.distributionDeviceId,
    routerId:null,
    oltId:null,
    customerId:null,
    status:"ACTIVE",
    address:input.address,
    description:input.description,
  }).returning();
  return row;
}

/*
 * =========================
 * AUTO GENERATE PORTS
 * =========================
 */
export async function createDistributionPortsRepository(
  nodeId:number,
  outputCount:number,
){
  const rows:NewNetworkTopologyPort[]=[
    {
      nodeId,
      portNumber:1,
      name:"INPUT-01",
      portType:"INPUT",
      status:"AVAILABLE",
    },
    ...Array.from({length:outputCount},(_,index)=>({
      nodeId,
      portNumber:index+2,
      name:`OUTPUT-${String(index+1).padStart(2,"0")}`,
      portType:"OUTPUT" as const,
      status:"AVAILABLE" as const,
    })),
  ];

  return db.insert(networkTopologyPorts).values(rows).returning();
}

/*
 * =========================
 * ROLLBACK
 * =========================
 */
export async function deleteDistributionTopologyNodeRepository(id:number){
  await db.delete(networkTopologyNodes).where(eq(networkTopologyNodes.id,id));
}
export async function deleteDistributionDeviceRepository(id:number){
  await db.delete(fiberDistributionDevices).where(eq(fiberDistributionDevices.id,id));
}

/*
 * =========================
 * DISTRIBUTION NODE DETAIL
 * =========================
 */
export async function findDistributionTopologyNodeDetailRepository(nodeId:number){
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
    deviceId:fiberDistributionDevices.id,
    deviceType:fiberDistributionDevices.deviceType,
    portCapacity:fiberDistributionDevices.portCapacity,
    splitterType:fiberDistributionDevices.splitterType,
    splitterRatio:fiberDistributionDevices.splitterRatio,
    inputPowerDbm:fiberDistributionDevices.inputPowerDbm,
    deviceDescription:fiberDistributionDevices.description,
  }).from(networkTopologyNodes)
    .innerJoin(
      fiberDistributionDevices,
      eq(networkTopologyNodes.distributionDeviceId,fiberDistributionDevices.id),
    )
    .where(eq(networkTopologyNodes.id,nodeId))
    .limit(1);

  return row??null;
}

/*
 * =========================
 * DISTRIBUTION PORTS
 * =========================
 */
export async function listDistributionTopologyPortsRepository(nodeId:number){
  return db.select({
    id:networkTopologyPorts.id,
    portNumber:networkTopologyPorts.portNumber,
    name:networkTopologyPorts.name,
    portType:networkTopologyPorts.portType,
    status:networkTopologyPorts.status,
    connectorType:networkTopologyPorts.connectorType,
    measuredPowerDbm:networkTopologyPorts.measuredPowerDbm,
    configuredLossDb:networkTopologyPorts.configuredLossDb,
    actualLossDb:networkTopologyPorts.actualLossDb,
    splitPercentage:networkTopologyPorts.splitPercentage,
    description:networkTopologyPorts.description,
  }).from(networkTopologyPorts)
    .where(eq(networkTopologyPorts.nodeId,nodeId))
    .orderBy(asc(networkTopologyPorts.portNumber));
}

/*
 * =========================
 * ACTIVE PORT CONNECTIONS
 * =========================
 */
export async function listDistributionPortConnectionsRepository(nodeId:number){
  return db.select({
    connectionId:fiberCoreConnections.id,

    // Fiber core
    coreId:fiberCableCores.id,
    coreNumber:fiberCableCores.coreNumber,
    coreColor:fiberCableCores.color,

    // Fiber cable
    cableId:fiberCables.id,
    cableName:fiberCables.name,

    // Source
    sourcePortId:sourcePort.id,
    sourcePortName:sourcePort.name,
    sourceNodeId:sourceNode.id,
    sourceNodeCode:sourceNode.code,
    sourceNodeName:sourceNode.name,
    sourceNodeType:sourceNode.nodeType,

    // Target
    targetPortId:targetPort.id,
    targetPortName:targetPort.name,
    targetNodeId:targetNode.id,
    targetNodeCode:targetNode.code,
    targetNodeName:targetNode.name,
    targetNodeType:targetNode.nodeType,
  })
    .from(fiberCoreConnections)

    // connection -> core
    .innerJoin(
      fiberCableCores,
      eq(fiberCoreConnections.coreId,fiberCableCores.id),
    )

    // core -> cable
    .innerJoin(
      fiberCables,
      eq(fiberCableCores.cableId,fiberCables.id),
    )

    // source connection -> source port
    .innerJoin(
      sourcePort,
      eq(fiberCoreConnections.sourcePortId,sourcePort.id),
    )

    // source port -> source node
    .innerJoin(
      sourceNode,
      eq(sourcePort.nodeId,sourceNode.id),
    )

    // target connection -> target port
    .innerJoin(
      targetPort,
      eq(fiberCoreConnections.targetPortId,targetPort.id),
    )

    // target port -> target node
    .innerJoin(
      targetNode,
      eq(targetPort.nodeId,targetNode.id),
    )

    .where(and(
      eq(fiberCoreConnections.status,"ACTIVE"),
      or(
        eq(sourcePort.nodeId,nodeId),
        eq(targetPort.nodeId,nodeId),
      ),
    ));
}


/*
 * =========================
 * UPDATE DISTRIBUTION NODE
 * =========================
 */
export async function updateDistributionTopologyNodeRepository(
  nodeId:number,
  input:{
    code:string;
    name:string;
    address:string|null;
    description:string|null;
  },
){
  const [row]=await db.update(networkTopologyNodes)
    .set({...input,updatedAt:new Date()})
    .where(eq(networkTopologyNodes.id,nodeId))
    .returning();

  return row??null;
}

/*
 * =========================
 * UPDATE DISTRIBUTION DEVICE
 * =========================
 */
export async function updateDistributionDeviceRepository(
  deviceId:number,
  input:{
    name:string;
    portCapacity:number;
    splitterRatio:string;
    inputPowerDbm:string|null;
    description:string|null;
  },
){
  const [row]=await db.update(fiberDistributionDevices)
    .set({
      ...input,
      splitterType:"RATIO",
      updatedAt:new Date(),
    })
    .where(eq(fiberDistributionDevices.id,deviceId))
    .returning();

  return row??null;
}

/*
 * =========================
 * CHECK PORT HISTORY
 * =========================
 */
export async function findDistributionPortConnectionHistoryRepository(
  portIds:number[],
){
  if(portIds.length===0) return null;

  const [row]=await db.select({
    id:fiberCoreConnections.id,
    sourcePortId:fiberCoreConnections.sourcePortId,
    targetPortId:fiberCoreConnections.targetPortId,
    status:fiberCoreConnections.status,
  })
    .from(fiberCoreConnections)
    .where(or(
      inArray(fiberCoreConnections.sourcePortId,portIds),
      inArray(fiberCoreConnections.targetPortId,portIds),
    ))
    .limit(1);

  return row??null;
}

/*
 * =========================
 * ADD OUTPUT PORTS
 * =========================
 */
export async function createDistributionOutputPortsRepository(
  nodeId:number,
  startOutput:number,
  endOutput:number,
){
  if(startOutput>endOutput) return [];

  return db.insert(networkTopologyPorts)
    .values(
      Array.from(
        {length:endOutput-startOutput+1},
        (_,index)=>{
          const outputNumber=startOutput+index;

          return {
            nodeId,
            oltPonPortId:null,
            portNumber:outputNumber+1,
            name:`OUTPUT-${String(outputNumber).padStart(2,"0")}`,
            portType:"OUTPUT" as const,
            status:"AVAILABLE" as const,
          };
        },
      ),
    )
    .returning();
}

/*
 * =========================
 * DELETE OUTPUT PORTS
 * =========================
 */
export async function deleteDistributionOutputPortsRepository(
  portIds:number[],
){
  if(portIds.length===0) return [];

  return db.delete(networkTopologyPorts)
    .where(inArray(networkTopologyPorts.id,portIds))
    .returning();
}