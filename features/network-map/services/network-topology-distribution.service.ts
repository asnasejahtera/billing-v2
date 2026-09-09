import type {CreateDistributionTopologyNodeInput} from "../schemas/create-distribution-topology-node.schema";
import {
  createDistributionDeviceRepository,
  createDistributionPortsRepository,
  createDistributionTopologyNodeRepository,
  deleteDistributionDeviceRepository,
  deleteDistributionTopologyNodeRepository,
} from "../repositories/network-topology-distribution.repository";
import type {NetworkMapNodeDto} from "../types/network-map-persistence.types";
import type {NetworkMapDistributionNodeDetailDto} from "../types/network-map-persistence.types";
import {
  findDistributionTopologyNodeDetailRepository,
  listDistributionPortConnectionsRepository,
  listDistributionTopologyPortsRepository,
} from "../repositories/network-topology-distribution.repository";
import {
  createDistributionOutputPortsRepository,
  deleteDistributionOutputPortsRepository,
  findDistributionPortConnectionHistoryRepository,
  updateDistributionDeviceRepository,
  updateDistributionTopologyNodeRepository,
} from "../repositories/network-topology-distribution.repository";
import type {UpdateDistributionTopologyNodeInput} from "../schemas/update-distribution-topology-node.schema";

/*
 * =========================
 * CREATE ODC / ODP + PORTS
 * =========================
 */
export async function createDistributionTopologyNodeService(
  input:CreateDistributionTopologyNodeInput,
):Promise<NetworkMapNodeDto>{
  let deviceId:number|null=null;
  let nodeId:number|null=null;

  try{
    const device=await createDistributionDeviceRepository({
      name:input.name,
      deviceType:input.nodeType,
      portCapacity:input.portCapacity,
      description:input.description?.trim()||null,
    });
    deviceId=device.id;

    const node=await createDistributionTopologyNodeRepository({
      code:input.code.trim(),
      name:input.name.trim(),
      nodeType:input.nodeType,
      latitude:input.latitude.toFixed(7),
      longitude:input.longitude.toFixed(7),
      distributionDeviceId:device.id,
      address:input.address?.trim()||null,
      description:input.description?.trim()||null,
    });
    nodeId=node.id;

    const ports=await createDistributionPortsRepository(node.id,input.portCapacity);
    if(ports.length!==input.portCapacity+1)
      throw new Error("Jumlah port yang dibuat tidak sesuai");

    return {
      id:node.id,
      code:node.code,
      name:node.name,
      nodeType:node.nodeType,
      position:{
        lat:Number(node.latitude),
        lng:Number(node.longitude),
      },
      status:node.status,
      address:node.address,
      description:node.description,
      routerId:null,
      oltId:null,
      distributionDeviceId:device.id,
      customerId:null,
      portSummary:{
        inputTotal:1,
        inputAvailable:1,
        outputTotal:input.portCapacity,
        outputAvailable:input.portCapacity,
        ponTotal:0,
        ponAvailable:0,
      },
    };
  }catch(error){
    try{
      if(nodeId) await deleteDistributionTopologyNodeRepository(nodeId);
      if(deviceId) await deleteDistributionDeviceRepository(deviceId);
    }catch{}
    throw error;
  }
}

/*
 * =========================
 * GET ODC / ODP DETAIL
 * =========================
 */
/*
 * =========================
 * GET ODC / ODP DETAIL
 * =========================
 */
export async function getDistributionTopologyNodeDetailService(
  nodeId:number,
):Promise<NetworkMapDistributionNodeDetailDto>{
  const [node,ports,connections]=await Promise.all([
    findDistributionTopologyNodeDetailRepository(nodeId),
    listDistributionTopologyPortsRepository(nodeId),
    listDistributionPortConnectionsRepository(nodeId),
  ]);

  if(!node) throw new Error("ODC/ODP tidak ditemukan");
  if(node.nodeType!=="ODC"&&node.nodeType!=="ODP")
    throw new Error("Node bukan ODC atau ODP");

  /*
   * Satu port hanya boleh mempunyai satu
   * fiber_core_connection ACTIVE.
   */
  const connectionMap=new Map<number,typeof connections[number]>();

  for(const connection of connections){
    if(connection.sourceNodeId===nodeId)
      connectionMap.set(connection.sourcePortId,connection);

    if(connection.targetNodeId===nodeId)
      connectionMap.set(connection.targetPortId,connection);
  }

  const mappedPorts=ports.map((port)=>{
    const connection=connectionMap.get(port.id);

    let mappedConnection:null|{
      connectionId:number;
      peerNodeId:number;
      peerNodeCode:string;
      peerNodeName:string;
      peerNodeType:string;
      peerPortId:number;
      peerPortName:string;
      cableId:number;
      cableName:string;
      coreId:number;
      coreNumber:number;
      coreColor:string|null;
    }=null;

    if(connection){
      const currentIsSource=connection.sourcePortId===port.id;

      mappedConnection={
        connectionId:connection.connectionId,
        peerNodeId:currentIsSource?connection.targetNodeId:connection.sourceNodeId,
        peerNodeCode:currentIsSource?connection.targetNodeCode:connection.sourceNodeCode,
        peerNodeName:currentIsSource?connection.targetNodeName:connection.sourceNodeName,
        peerNodeType:currentIsSource?connection.targetNodeType:connection.sourceNodeType,
        peerPortId:currentIsSource?connection.targetPortId:connection.sourcePortId,
        peerPortName:currentIsSource?connection.targetPortName:connection.sourcePortName,
        cableId:connection.cableId,
        cableName:connection.cableName,
        coreId:connection.coreId,
        coreNumber:connection.coreNumber,
        coreColor:connection.coreColor,
      };
    }

    return {
      id:port.id,
      portNumber:port.portNumber,
      name:port.name,
      portType:port.portType,
      status:port.status,
      connectorType:port.connectorType,
      measuredPowerDbm:
        port.measuredPowerDbm===null
          ?null
          :Number(port.measuredPowerDbm),
      configuredLossDb:
        port.configuredLossDb===null
          ?null
          :Number(port.configuredLossDb),
      actualLossDb:
        port.actualLossDb===null
          ?null
          :Number(port.actualLossDb),
      splitPercentage:
        port.splitPercentage===null
          ?null
          :Number(port.splitPercentage),
      description:port.description,
      connection:mappedConnection,
    };
  });

  const inputPorts=mappedPorts.filter((port)=>port.portType==="INPUT");
  const outputPorts=mappedPorts.filter((port)=>port.portType==="OUTPUT");

  return {
    nodeId:node.nodeId,
    deviceId:node.deviceId,
    nodeType:node.nodeType,
    code:node.code,
    name:node.name,
    status:node.status,
    address:node.address,
    description:node.description,
    latitude:Number(node.latitude),
    longitude:Number(node.longitude),
    portCapacity:node.portCapacity,
    splitterType:node.splitterType,
    splitterRatio:node.splitterRatio,
    inputPowerDbm:
      node.inputPowerDbm===null
        ?null
        :Number(node.inputPowerDbm),
    deviceDescription:node.deviceDescription,
    inputTotal:inputPorts.length,
    inputUsed:inputPorts.filter((port)=>port.status==="USED").length,
    outputTotal:outputPorts.length,
    outputUsed:outputPorts.filter((port)=>port.status==="USED").length,
    ports:mappedPorts,
  };
}

function distributionDetailToMapNode(
  detail:NetworkMapDistributionNodeDetailDto,
):NetworkMapNodeDto{
  const inputs=detail.ports.filter((port)=>port.portType==="INPUT");
  const outputs=detail.ports.filter((port)=>port.portType==="OUTPUT");

  return {
    id:detail.nodeId,
    code:detail.code,
    name:detail.name,
    nodeType:detail.nodeType,
    position:{lat:detail.latitude,lng:detail.longitude},
    status:detail.status,
    address:detail.address,
    description:detail.description,
    routerId:null,
    oltId:null,
    distributionDeviceId:detail.deviceId,
    customerId:null,
    portSummary:{
      inputTotal:inputs.length,
      inputAvailable:inputs.filter((port)=>port.status==="AVAILABLE").length,
      outputTotal:outputs.length,
      outputAvailable:outputs.filter((port)=>port.status==="AVAILABLE").length,
      ponTotal:0,
      ponAvailable:0,
    },
  };
}

/*
 * =========================
 * UPDATE ODC / ODP
 * =========================
 */
export async function updateDistributionTopologyNodeService(
  input:UpdateDistributionTopologyNodeInput,
){
  const current=
    await getDistributionTopologyNodeDetailService(input.nodeId);

  if(current.splitterType!=="RATIO")
    throw new Error("Safe resize saat ini hanya mendukung splitter RATIO");

  const outputs=current.ports
    .filter((port)=>port.portType==="OUTPUT")
    .sort((a,b)=>a.portNumber-b.portNumber);

  /*
   * Jangan resize jika struktur existing
   * sudah tidak sesuai dengan portCapacity.
   */
  if(outputs.length!==current.portCapacity){
    throw new Error(
      `Struktur OUTPUT tidak konsisten. Device=${current.portCapacity}, port aktual=${outputs.length}`,
    );
  }

  const oldCapacity=current.portCapacity;
  const newCapacity=input.portCapacity;

  /*
   * =========================
   * SAFE SHRINK
   * =========================
   */
  const removablePorts=
    newCapacity<oldCapacity
      ?outputs.slice(newCapacity)
      :[];

  if(removablePorts.length>0){
    const unsafe=removablePorts.filter(
      (port)=>port.status!=="AVAILABLE",
    );

    if(unsafe.length>0){
      throw new Error(
        `Ratio tidak dapat dikurangi. ${unsafe
          .map((port)=>`${port.name} (${port.status})`)
          .join(", ")} belum aman dihapus.`,
      );
    }

    const history=
      await findDistributionPortConnectionHistoryRepository(
        removablePorts.map((port)=>port.id),
      );

    if(history){
      throw new Error(
        "Ratio tidak dapat dikurangi karena salah satu OUTPUT yang akan dihapus memiliki riwayat koneksi core.",
      );
    }
  }

  /*
   * =========================
   * SAVE OLD STATE
   * =========================
   */
  const oldNode={
    code:current.code,
    name:current.name,
    address:current.address,
    description:current.description,
  };

  const oldDevice={
    name:current.name,
    portCapacity:current.portCapacity,
    splitterRatio:current.splitterRatio??`1:${current.portCapacity}`,
    inputPowerDbm:
      current.inputPowerDbm===null
        ?null
        :current.inputPowerDbm.toFixed(2),
    description:current.deviceDescription,
  };

  /*
   * =========================
   * UPDATE NODE
   * =========================
   */
  const updatedNode=
    await updateDistributionTopologyNodeRepository(
      input.nodeId,
      {
        code:input.code,
        name:input.name,
        address:input.address,
        description:input.description,
      },
    );

  if(!updatedNode)
    throw new Error("Gagal memperbarui topology node");

  /*
   * =========================
   * UPDATE DEVICE
   * =========================
   */
  let updatedDevice;

  try{
    updatedDevice=
      await updateDistributionDeviceRepository(
        current.deviceId,
        {
          name:input.name,
          portCapacity:newCapacity,
          splitterRatio:`1:${newCapacity}`,
          inputPowerDbm:
            input.inputPowerDbm===null
              ?null
              :input.inputPowerDbm.toFixed(2),
          description:input.description,
        },
      );

    if(!updatedDevice)
      throw new Error("Gagal memperbarui perangkat ODC/ODP");
  }catch(error){
    await updateDistributionTopologyNodeRepository(
      input.nodeId,
      oldNode,
    );
    throw error;
  }

  /*
   * =========================
   * RESIZE OUTPUT
   * =========================
   */
  try{
    if(newCapacity>oldCapacity){
      await createDistributionOutputPortsRepository(
        input.nodeId,
        oldCapacity+1,
        newCapacity,
      );
    }

    if(newCapacity<oldCapacity){
      await deleteDistributionOutputPortsRepository(
        removablePorts.map((port)=>port.id),
      );
    }
  }catch(error){
    /*
     * Neon HTTP flow ini tidak memakai transaction.
     * Resize adalah statement terakhir sehingga
     * jika gagal kita cukup rollback metadata.
     */
    await updateDistributionDeviceRepository(
      current.deviceId,
      oldDevice,
    );

    await updateDistributionTopologyNodeRepository(
      input.nodeId,
      oldNode,
    );

    throw error;
  }

  const detail=
    await getDistributionTopologyNodeDetailService(input.nodeId);

  return {
    detail,
    node:distributionDetailToMapNode(detail),
  };
}