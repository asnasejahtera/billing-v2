import "server-only";

import {
  findCustomerOnuConnectionRepository,
  findCustomerOnuTopologyPortRepository,
  findCustomerTopologyDetailRepository,
} from "../repositories/network-topology-customer.repository";
import type {
  NetworkMapCustomerNodeDetailDto,
  NetworkMapCustomerOnuConnection,
} from "../types/network-map-persistence.types";

/*
 * =========================
 * CUSTOMER DETAIL
 * =========================
 */
export async function getCustomerTopologyNodeDetailService(
  nodeId:number,
):Promise<NetworkMapCustomerNodeDetailDto>{
  const customer=
    await findCustomerTopologyDetailRepository(nodeId);

  if(!customer)
    throw new Error("Titik customer tidak ditemukan");

  const port=
    await findCustomerOnuTopologyPortRepository(nodeId);

  if(!port){
    return {
      ...customer,
      onuPort:null,
    };
  }

  const connection=
    await findCustomerOnuConnectionRepository(port.id);

  let mappedConnection:NetworkMapCustomerOnuConnection|null=null;

  if(connection){
    const currentIsSource=
      connection.sourcePortId===port.id;

    mappedConnection={
      connectionId:connection.connectionId,

      peerNodeId:currentIsSource
        ?connection.targetNodeId
        :connection.sourceNodeId,

      peerNodeCode:currentIsSource
        ?connection.targetNodeCode
        :connection.sourceNodeCode,

      peerNodeName:currentIsSource
        ?connection.targetNodeName
        :connection.sourceNodeName,

      peerNodeType:currentIsSource
        ?connection.targetNodeType
        :connection.sourceNodeType,

      peerPortId:currentIsSource
        ?connection.targetPortId
        :connection.sourcePortId,

      peerPortName:currentIsSource
        ?connection.targetPortName
        :connection.sourcePortName,
    };
  }

  return {
    ...customer,

    onuPort:{
      id:port.id,
      name:port.name,
      portNumber:port.portNumber,
      status:port.status,
      measuredPowerDbm:
        port.measuredPowerDbm===null
          ?null
          :Number(port.measuredPowerDbm),
      connection:mappedConnection,
    },
  };
}