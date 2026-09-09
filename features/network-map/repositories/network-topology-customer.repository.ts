import "server-only";

import {and,eq,or} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {db} from "@/db";
import {customers} from "@/db/schema/cusotmers";
import {fiberCoreConnections} from "@/db/schema/fiber-core-connections";
import {networkTopologyNodes} from "@/db/schema/network-topology-nodes";
import {networkTopologyPorts} from "@/db/schema/network-topology-ports";

const sourcePort=alias(networkTopologyPorts,"customer_source_port");
const targetPort=alias(networkTopologyPorts,"customer_target_port");
const sourceNode=alias(networkTopologyNodes,"customer_source_node");
const targetNode=alias(networkTopologyNodes,"customer_target_node");

/*
 * =========================
 * CUSTOMER NODE DETAIL
 * =========================
 */
export async function findCustomerTopologyDetailRepository(nodeId:number){
  const [row]=await db.select({
    nodeId:networkTopologyNodes.id,
    code:networkTopologyNodes.code,
    name:networkTopologyNodes.name,
    status:networkTopologyNodes.status,
    customerId:customers.id,

    customerName:customers.name,
    phone:customers.phone,
    customerStatus:customers.status,
    pppoeUsername:customers.pppoeUsername,
    isOnline:customers.isOnline,
    remoteAddress:customers.remoteAddress,
    onuStatus:customers.onuStatus,
    onuReceivePower:customers.onuReceivePower,
    onuVendor:customers.onuVendor,
    onuDeviceType:customers.onuDeviceType,
    onuMacAddress:customers.onuMacAddress,
    onuDistanceMeters:customers.onuDistanceMeters,
  })
    .from(networkTopologyNodes)
    .innerJoin(
      customers,
      eq(networkTopologyNodes.customerId,customers.id),
    )
    .where(and(
      eq(networkTopologyNodes.id,nodeId),
      eq(networkTopologyNodes.nodeType,"CUSTOMER"),
    ))
    .limit(1);

  return row??null;
}

/*
 * =========================
 * CUSTOMER ONU PORT
 * =========================
 */
export async function findCustomerOnuTopologyPortRepository(nodeId:number){
  const [row]=await db.select({
    id:networkTopologyPorts.id,
    nodeId:networkTopologyPorts.nodeId,
    portNumber:networkTopologyPorts.portNumber,
    name:networkTopologyPorts.name,
    status:networkTopologyPorts.status,
    measuredPowerDbm:networkTopologyPorts.measuredPowerDbm,
  })
    .from(networkTopologyPorts)
    .where(and(
      eq(networkTopologyPorts.nodeId,nodeId),
      eq(networkTopologyPorts.portNumber,1),
    ))
    .limit(1);

  return row??null;
}

/*
 * =========================
 * ACTIVE ONU CONNECTION
 * =========================
 */
export async function findCustomerOnuConnectionRepository(portId:number){
  const [row]=await db.select({
    connectionId:fiberCoreConnections.id,

    sourcePortId:sourcePort.id,
    sourcePortName:sourcePort.name,
    sourceNodeId:sourceNode.id,
    sourceNodeCode:sourceNode.code,
    sourceNodeName:sourceNode.name,
    sourceNodeType:sourceNode.nodeType,

    targetPortId:targetPort.id,
    targetPortName:targetPort.name,
    targetNodeId:targetNode.id,
    targetNodeCode:targetNode.code,
    targetNodeName:targetNode.name,
    targetNodeType:targetNode.nodeType,
  })
    .from(fiberCoreConnections)
    .innerJoin(
      sourcePort,
      eq(fiberCoreConnections.sourcePortId,sourcePort.id),
    )
    .innerJoin(
      sourceNode,
      eq(sourcePort.nodeId,sourceNode.id),
    )
    .innerJoin(
      targetPort,
      eq(fiberCoreConnections.targetPortId,targetPort.id),
    )
    .innerJoin(
      targetNode,
      eq(targetPort.nodeId,targetNode.id),
    )
    .where(and(
      eq(fiberCoreConnections.status,"ACTIVE"),
      or(
        eq(fiberCoreConnections.sourcePortId,portId),
        eq(fiberCoreConnections.targetPortId,portId),
      ),
    ))
    .limit(1);

  return row??null;
}