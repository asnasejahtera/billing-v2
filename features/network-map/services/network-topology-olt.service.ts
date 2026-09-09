import "server-only";

import {
  findOltTopologyNodeDetailRepository,
  listOltTopologyPonPortsRepository,
} from "../repositories/network-topology-olt.repository";
import type {
  NetworkMapOltNodeDetailDto,
  NetworkMapOltPonPortDetail,
} from "../types/network-map-persistence.types";

/*
 * =========================
 * OLT DETAIL
 * =========================
 */
export async function getOltTopologyNodeDetailService(
  nodeId:number,
):Promise<NetworkMapOltNodeDetailDto>{
  const node=await findOltTopologyNodeDetailRepository(nodeId);

  if(!node)
    throw new Error("Node OLT tidak ditemukan");

  if(node.nodeType!=="OLT")
    throw new Error("Node yang dipilih bukan OLT");

  const rows=
    await listOltTopologyPonPortsRepository(node.oltId);

  const ports:NetworkMapOltPonPortDetail[]=rows.map((port)=>({
    id:port.id,
    ponNumber:port.ponNumber,
    name:port.name??`PON-${String(port.ponNumber).padStart(2,"0")}`,
    txPowerDbm:
      port.txPowerDbm===null
        ?null
        :Number(port.txPowerDbm),
    description:port.description,

    topologyPortId:port.topologyPortId,
    topologyPortName:port.topologyPortName,
    topologyPortStatus:port.topologyPortStatus,
    measuredPowerDbm:
      port.measuredPowerDbm===null
        ?null
        :Number(port.measuredPowerDbm),
  }));

  const mappedPonCount=
    ports.filter((port)=>port.topologyPortId!==null).length;

  const availablePonCount=
    ports.filter(
      (port)=>port.topologyPortStatus==="AVAILABLE",
    ).length;

  const usedPonCount=
    ports.filter(
      (port)=>port.topologyPortStatus==="USED",
    ).length;

  return {
    nodeId:node.nodeId,
    code:node.code,
    name:node.name,
    nodeType:"OLT",
    status:node.status,
    latitude:Number(node.latitude),
    longitude:Number(node.longitude),
    address:node.address,
    description:node.description,

    oltId:node.oltId,
    oltName:node.oltName,
    brand:node.brand,
    model:node.model,
    ponCount:node.ponCount,
    isActive:node.isActive,
    oltDescription:node.oltDescription,

    physicalPonCount:ports.length,
    mappedPonCount,
    availablePonCount,
    usedPonCount,

    ports,
  };
}