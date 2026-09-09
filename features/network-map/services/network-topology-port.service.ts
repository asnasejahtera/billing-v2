import {
  ensureOltPonPortRepository,
  findDistributionPortContextRepository,
  findNetworkTopologyPortContextRepository,
  findOltPortContextRepository,
  listNetworkTopologyPortsByNodeRepository,
  listOltPonPortsRepository,
  upsertNetworkTopologyPortRepository,
  listNetworkTopologyPortSummariesRepository,
} from "../repositories/network-topology-port.repository";

import type {
  NetworkMapNodePortSummaryUpdate,
  NetworkMapPortSummary,
} from "../types/network-map-persistence.types";

function formatPortNumber(value:number){
  return String(value).padStart(2,"0");
}

/*
 * =========================
 * OLT PORT PROVISIONING
 * =========================
 */
async function provisionOltPorts(nodeId:number,oltId:number){
  const olt=await findOltPortContextRepository(oltId);
  if(!olt) throw new Error("OLT untuk topology node tidak ditemukan");
  if(olt.ponCount<1) throw new Error("OLT tidak mempunyai PON port");

  /*
   * Pastikan physical olt_pon_ports tersedia.
   * Hanya membuat yang hilang, tidak menghapus.
   */
  for(let ponNumber=1;ponNumber<=olt.ponCount;ponNumber++){
    await ensureOltPonPortRepository({
      oltId:olt.id,
      ponNumber,
      name:`PON-${formatPortNumber(ponNumber)}`,
    });
  }

  const ponPorts=await listOltPonPortsRepository(olt.id);

  /*
   * Mirror physical PON → topology port.
   */
  for(const pon of ponPorts){
    await upsertNetworkTopologyPortRepository({
      nodeId,
      oltPonPortId:pon.id,
      portNumber:pon.ponNumber,
      name:pon.name?.trim()||`PON-${formatPortNumber(pon.ponNumber)}`,
      portType:"PON",
    });
  }
}

/*
 * =========================
 * ODC / ODP PORT PROVISIONING
 * =========================
 */
async function provisionDistributionPorts(
  nodeId:number,
  distributionDeviceId:number,
){
  const device=await findDistributionPortContextRepository(distributionDeviceId);
  if(!device) throw new Error("ODC/ODP untuk topology node tidak ditemukan");
  if(device.portCapacity<1) throw new Error(`${device.deviceType} tidak mempunyai output port`);

  /*
   * Port #1 = INPUT-01.
   * portCapacity hanya menghitung OUTPUT,
   * sesuai schema fiber_distribution_devices.
   */
  await upsertNetworkTopologyPortRepository({
    nodeId,
    portNumber:1,
    name:"INPUT-01",
    portType:"INPUT",
  });

  /*
   * OUTPUT-01 dimulai dari physical portNumber 2
   * karena portNumber harus unique per node.
   */
  for(let index=1;index<=device.portCapacity;index++){
    await upsertNetworkTopologyPortRepository({
      nodeId,
      portNumber:index+1,
      name:`OUTPUT-${formatPortNumber(index)}`,
      portType:"OUTPUT",
    });
  }
}

/*
 * =========================
 * ENSURE NODE PORTS
 * =========================
 */
export async function ensureNetworkTopologyNodePortsService(nodeId:number){
  const node=await findNetworkTopologyPortContextRepository(nodeId);
  if(!node) throw new Error("Topology node tidak ditemukan");

  if(node.nodeType==="OLT"){
    if(!node.oltId) throw new Error("Topology node OLT tidak mempunyai oltId");
    await provisionOltPorts(node.id,node.oltId);
  }

  if(node.nodeType==="ODC"||node.nodeType==="ODP"){
    if(!node.distributionDeviceId)
      throw new Error(`${node.nodeType} tidak mempunyai distributionDeviceId`);
    await provisionDistributionPorts(node.id,node.distributionDeviceId);
  }

  /*
   * ROUTER/CUSTOMER/POLE belum diprovision otomatis
   * sampai sumber physical port-nya ditentukan.
   */
  return listNetworkTopologyPortsByNodeRepository(node.id);
}

/*
 * =========================
 * MAP PORT SUMMARIES
 * =========================
 */
export async function getNetworkMapPortSummariesService(
  nodeIds:number[],
):Promise<NetworkMapNodePortSummaryUpdate[]>{
  const ids=[...new Set(nodeIds.filter((id)=>id>0))];
  if(ids.length===0) return [];

  const rows=await listNetworkTopologyPortSummariesRepository(ids);
  const map=new Map<number,NetworkMapPortSummary>(
    rows.map((row)=>[
      row.nodeId,
      {
        inputTotal:Number(row.inputTotal),
        inputAvailable:Number(row.inputAvailable),
        outputTotal:Number(row.outputTotal),
        outputAvailable:Number(row.outputAvailable),
        ponTotal:Number(row.ponTotal),
        ponAvailable:Number(row.ponAvailable),
      },
    ]),
  );

  return ids.map((nodeId)=>({
    nodeId,
    portSummary:map.get(nodeId)??{
      inputTotal:0,
      inputAvailable:0,
      outputTotal:0,
      outputAvailable:0,
      ponTotal:0,
      ponAvailable:0,
    },
  }));
}