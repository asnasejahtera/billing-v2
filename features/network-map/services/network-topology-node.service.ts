import type { NetworkMapNodeDto, NetworkMapCreateOptions,NetworkMapCustomerInfo } from "../types/network-map-persistence.types";

import {
  createNetworkTopologyNodeRepository,
  findNetworkTopologyNodeByCodeRepository,
  findTopologyCustomerRepository,
  findTopologyDistributionDeviceRepository,
  findTopologyOltRepository,
  findTopologyRouterRepository,
  listAvailableTopologyCustomersRepository,
  listAvailableTopologyDistributionDevicesRepository,
  listAvailableTopologyOltsRepository,
  listAvailableTopologyRoutersRepository,
  listNetworkTopologyNodesRepository,
  updateNetworkTopologyNodePositionRepository,
  deleteNetworkTopologyNodeRepository,
  findBlockingTopologyPortRepository,
  findFiberCableUsingNodeRepository,
  findNetworkTopologyNodeDeleteContextRepository,
  findNetworkTopologyNodeByIdRepository,
  updateNetworkTopologyNodeRepository,
  listAvailableNetworkMapOltsRepository,
  ensureCustomerOnuPortRepository
} from "../repositories/network-topology-node.repository";

import type { 
  CreateNetworkTopologyNodeInput, 
  UpdateNetworkTopologyNodePositionInput,
  UpdateNetworkTopologyNodeInput
} from "../schemas/network-topology-node.schema";

import {listNetworkTopologyPortSummariesRepository} from "../repositories/network-topology-port.repository";
import type {NetworkMapPortSummary} from "../types/network-map-persistence.types";

/*
 * =========================
 * LIST MAP NODES
 * =========================
 * Persistence numeric string dikonversi
 * menjadi number hanya pada DTO/UI boundary.
 */
export async function listNetworkMapNodesService(){
  const rows=await listNetworkTopologyNodesRepository();
  if(rows.length===0) return [];

  const summaries=
    await listNetworkTopologyPortSummariesRepository(
      rows.map((row)=>row.id),
    );

  const summaryMap=new Map(
    summaries.map((item)=>[
      item.nodeId,
      {
        inputTotal:item.inputTotal,
        inputAvailable:item.inputAvailable,
        outputTotal:item.outputTotal,
        outputAvailable:item.outputAvailable,
        ponTotal:item.ponTotal,
        ponAvailable:item.ponAvailable,
      },
    ]),
  );

  return rows.map((row)=>({
    id:row.id,
    code:row.code,
    name:row.name,
    nodeType:row.nodeType,
    position:{
      lat:Number(row.latitude),
      lng:Number(row.longitude),
    },
    status:row.status,
    address:row.address,
    description:row.description,
    routerId:row.routerId,
    oltId:row.oltId,
    distributionDeviceId:row.distributionDeviceId,
    customerId:row.customerId,
    portSummary:summaryMap.get(row.id)??emptyPortSummary(),

    /*
     * CUSTOMER INFOBOX
     */
    customerInfo:
      row.nodeType==="CUSTOMER"
        ?{
            rxPower:row.customerRxPower,
            onuStatus:row.customerOnuStatus,
            remoteAddress:row.customerRemoteAddress,
          }
        :null,
  }));
}


/*
 * =========================
 * CREATE MAP NODE
 * =========================
 */
// export async function createNetworkMapNodeService(
//   input: CreateNetworkTopologyNodeInput,
// ): Promise<NetworkMapNodeDto> {
//   const duplicate = await findNetworkTopologyNodeByCodeRepository(input.code);
//   if (duplicate) throw new Error(`Kode ${input.code} sudah digunakan`);

//   let routerId: number | null = null;
//   let oltId: number | null = null;
//   let distributionDeviceId: number | null = null;
//   let customerId: number | null = null;

//   /* =========================
//    * VALIDATE DEVICE REFERENCE
//    * ========================= */
//   if (input.nodeType === "ROUTER") {
//     if (!input.routerId) throw new Error("Router wajib dipilih");
//     const router = await findTopologyRouterRepository(input.routerId);
//     if (!router) throw new Error("Router tidak ditemukan");
//     routerId = router.id;
//   }

//   if (input.nodeType === "OLT") {
//     if (!input.oltId) throw new Error("OLT wajib dipilih");
//     const olt = await findTopologyOltRepository(input.oltId);
//     if (!olt) throw new Error("OLT tidak ditemukan");
//     oltId = olt.id;
//   }

//   if (input.nodeType === "ODC" || input.nodeType === "ODP") {
//     if (!input.distributionDeviceId) {
//       throw new Error(`${input.nodeType} wajib dipilih`);
//     }

//     const device = await findTopologyDistributionDeviceRepository(
//       input.distributionDeviceId,
//     );

//     if (!device) throw new Error("Perangkat distribusi tidak ditemukan");

//     if (device.deviceType !== input.nodeType) {
//       throw new Error(
//         `Perangkat yang dipilih bukan ${input.nodeType}`,
//       );
//     }

//     distributionDeviceId = device.id;
//   }

//   if (input.nodeType === "CUSTOMER") {
//     if (!input.customerId) throw new Error("Customer wajib dipilih");
//     const customer = await findTopologyCustomerRepository(input.customerId);
//     if (!customer) throw new Error("Customer tidak ditemukan");
//     customerId = customer.id;
//   }

//   /*
//    * POLE tidak membutuhkan device reference.
//    */

//   const created = await createNetworkTopologyNodeRepository({
//     code: input.code,
//     name: input.name,
//     nodeType: input.nodeType,
//     latitude: input.latitude.toFixed(7),
//     longitude: input.longitude.toFixed(7),
//     routerId,
//     oltId,
//     distributionDeviceId,
//     customerId,
//     address: input.address ?? null,
//     description: input.description ?? null,
//   });

//   if (!created) throw new Error("Gagal membuat titik topology");

//   return {
//     id: created.id,
//     code: created.code,
//     name: created.name,
//     nodeType: created.nodeType,
//     position: {
//       lat: Number(created.latitude),
//       lng: Number(created.longitude),
//     },
//     status: created.status,
//     address: created.address,
//     description: created.description,
//     routerId: created.routerId,
//     oltId: created.oltId,
//     distributionDeviceId: created.distributionDeviceId,
//     customerId: created.customerId,
//     portSummary:{
//       inputTotal:1,
//       inputAvailable:1,
//       outputTotal:0,
//       outputAvailable:0,
//       ponTotal:0,
//       ponAvailable:0,
//     },
//   };
// }

/*
 * =========================
 * CREATE MAP NODE
 * =========================
 */
export async function createNetworkMapNodeService(
  input:CreateNetworkTopologyNodeInput,
):Promise<NetworkMapNodeDto>{
  const duplicate=
    await findNetworkTopologyNodeByCodeRepository(
      input.code,
    );

  if(duplicate)
    throw new Error(
      `Kode ${input.code} sudah digunakan`,
    );

  let routerId:number|null=null;
  let oltId:number|null=null;
  let distributionDeviceId:number|null=null;
  let customerId:number|null=null;
  let customerInfo:NetworkMapCustomerInfo|null=null;

  /*
   * =========================
   * ROUTER
   * =========================
   */
  if(input.nodeType==="ROUTER"){
    if(!input.routerId)
      throw new Error("Router wajib dipilih");

    const router=
      await findTopologyRouterRepository(
        input.routerId,
      );

    if(!router)
      throw new Error("Router tidak ditemukan");

    routerId=router.id;
  }

  /*
   * =========================
   * OLT
   * =========================
   */
  if(input.nodeType==="OLT"){
    if(!input.oltId)
      throw new Error("OLT wajib dipilih");

    const olt=
      await findTopologyOltRepository(
        input.oltId,
      );

    if(!olt)
      throw new Error("OLT tidak ditemukan");

    oltId=olt.id;
  }

  /*
   * =========================
   * DISTRIBUTION
   * =========================
   */
  if(
    input.nodeType==="ODC"||
    input.nodeType==="ODP"
  ){
    if(!input.distributionDeviceId)
      throw new Error(
        `${input.nodeType} wajib dipilih`,
      );

    const device=
      await findTopologyDistributionDeviceRepository(
        input.distributionDeviceId,
      );

    if(!device)
      throw new Error(
        "Perangkat distribusi tidak ditemukan",
      );

    if(device.deviceType!==input.nodeType)
      throw new Error(
        `Perangkat yang dipilih bukan ${input.nodeType}`,
      );

    distributionDeviceId=device.id;
  }

  /*
   * =========================
   * CUSTOMER
   * =========================
   */
  if(input.nodeType==="CUSTOMER"){
    if(!input.customerId)
      throw new Error("Customer wajib dipilih");

    /*
    * Customer sebenarnya sudah kita query di sini
    * untuk validasi reference.
    *
    * Jadi sekalian ambil data yang diperlukan InfoBox.
    */
    const customer=
      await findTopologyCustomerRepository(
        input.customerId,
      );

    if(!customer)
      throw new Error("Customer tidak ditemukan");

    customerId=customer.id;

    /*
    * Data ini tidak disimpan ulang ke topology node.
    * Ini hanya dibawa dalam DTO map supaya
    * marker yang baru dibuat langsung tahu data ONU.
    */
    customerInfo={
      rxPower:customer.onuReceivePower,
      onuStatus:customer.onuStatus,
      remoteAddress:customer.remoteAddress,
    };
  }

  /*
   * POLE tidak mempunyai reference.
   */

  
  /*
   * =========================
   * CREATE NODE
   * =========================
   */
  const created=
    await createNetworkTopologyNodeRepository({
      code:input.code,
      name:input.name,
      nodeType:input.nodeType,
      latitude:input.latitude.toFixed(7),
      longitude:input.longitude.toFixed(7),
      routerId,
      oltId,
      distributionDeviceId,
      customerId,
      address:input.address??null,
      description:input.description??null,
    });

  if(!created)
    throw new Error(
      "Gagal membuat titik topology",
    );

  /*
   * =========================
   * CUSTOMER ONU
   * =========================
   */
  if(created.nodeType==="CUSTOMER"){
    try{
      await ensureCustomerOnuPortRepository(
        created.id,
      );
    }catch(error){
      /*
       * Neon HTTP tidak punya transaction.
       * Jika pembuatan ONU gagal, rollback
       * topology node supaya tidak terbentuk
       * customer tanpa endpoint.
       */
      await deleteNetworkTopologyNodeRepository(
        created.id,
      );

      throw error;
    }
  }

  /*
   * =========================
   * PORT SUMMARY
   * =========================
   */
  const portSummary:NetworkMapPortSummary=
    created.nodeType==="CUSTOMER"
      ?{
          inputTotal:1,
          inputAvailable:1,
          outputTotal:0,
          outputAvailable:0,
          ponTotal:0,
          ponAvailable:0,
        }
      :emptyPortSummary();

  /*
   * =========================
   * DTO
   * =========================
   */
  return {
    id:created.id,
    code:created.code,
    name:created.name,
    nodeType:created.nodeType,
    position:{
      lat:Number(created.latitude),
      lng:Number(created.longitude),
    },
    status:created.status,
    address:created.address,
    description:created.description,
    routerId:created.routerId,
    oltId:created.oltId,
    distributionDeviceId:created.distributionDeviceId,
    customerId:created.customerId,
    portSummary:
      created.nodeType==="CUSTOMER"
        ?{
            inputTotal:1,
            inputAvailable:1,
            outputTotal:0,
            outputAvailable:0,
            ponTotal:0,
            ponAvailable:0,
          }
        :emptyPortSummary(),
    customerInfo,
  };
}

/*
 * =========================
 * CREATE NODE OPTIONS
 * =========================
 * Hanya entity yang belum mempunyai topology node.
 */
export async function getNetworkMapCreateOptionsService(): Promise<NetworkMapCreateOptions> {
  const [
    routers,
    olts,
    distributionDevices,
    customers,
  ] = await Promise.all([
    listAvailableTopologyRoutersRepository(),
    listAvailableNetworkMapOltsRepository(),
    listAvailableTopologyDistributionDevicesRepository(),
    listAvailableTopologyCustomersRepository(),
  ]);

  return {
    routers: routers.map((router) => ({
      id: router.id,
      label: router.host,
    })),

    olts:olts.map((olt)=>({
      id:olt.id,
      label:[
        olt.name,
        olt.brand,
        olt.model,
      ].filter(Boolean).join(" · "),
    })),

    odcs: distributionDevices
      .filter((device) => device.deviceType === "ODC")
      .map((device) => ({
        id: device.id,
        label: device.name,
      })),

    odps: distributionDevices
      .filter((device) => device.deviceType === "ODP")
      .map((device) => ({
        id: device.id,
        label: device.name,
      })),

    customers: customers.map((customer) => ({
      id: customer.id,
      label: customer.name,
    })),
  };
}

/*
 * =========================
 * UPDATE MAP NODE POSITION
 * =========================
 */
export async function updateNetworkMapNodePositionService(
  input: UpdateNetworkTopologyNodePositionInput,
) {
  const updated =
    await updateNetworkTopologyNodePositionRepository(
      input.id,
      input.latitude.toFixed(7),
      input.longitude.toFixed(7),
    );

  if (!updated) {
    throw new Error("Titik topology tidak ditemukan");
  }

  return {
    id: updated.id,
    position: {
      lat: Number(updated.latitude),
      lng: Number(updated.longitude),
    },
  };
}

/*
 * =========================
 * SAFE DELETE MAP NODE
 * =========================
 */
export async function deleteNetworkMapNodeService(
  id: number,
) {
  const node =
    await findNetworkTopologyNodeDeleteContextRepository(id);

  if (!node) {
    throw new Error("Titik topology tidak ditemukan");
  }

  /*
   * =========================
   * CABLE SAFETY
   * =========================
   */
  const cable =
    await findFiberCableUsingNodeRepository(id);

  if (cable) {
    throw new Error(
      `${node.code} masih digunakan oleh kabel ${cable.name}. Hapus atau pindahkan kabel terlebih dahulu.`,
    );
  }

  /*
   * =========================
   * PORT SAFETY
   * =========================
   */
  const blockingPort =
    await findBlockingTopologyPortRepository(id);

  if (blockingPort) {
    throw new Error(
      `${node.code} masih memiliki port ${blockingPort.name} dengan status ${blockingPort.status}.`,
    );
  }

  try {
    const deleted =
      await deleteNetworkTopologyNodeRepository(id);

    if (!deleted) {
      throw new Error("Titik topology gagal dihapus");
    }
  } catch (error) {
    /*
     * FK database tetap menjadi proteksi terakhir
     * jika ada dependency yang muncul setelah validasi.
     */
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23503"
    ) {
      throw new Error(
        `${node.code} masih mempunyai relasi jaringan dan tidak dapat dihapus.`,
      );
    }

    throw error;
  }

  /*
   * Data ini digunakan frontend untuk mengembalikan
   * entity yang sudah bebas ke Create Node options.
   */
  let releasedReference:
    | {
        type: "ROUTER" | "OLT" | "ODC" | "ODP" | "CUSTOMER";
        id: number;
        label: string;
      }
    | null = null;

  if (node.nodeType === "ROUTER" && node.routerId) {
    releasedReference = {
      type: "ROUTER",
      id: node.routerId,
      label: node.routerLabel ?? node.name,
    };
  }

  if (node.nodeType === "OLT" && node.oltId) {
    releasedReference = {
      type: "OLT",
      id: node.oltId,
      label: node.oltLabel ?? node.name,
    };
  }

  if (
    (node.nodeType === "ODC" ||
      node.nodeType === "ODP") &&
    node.distributionDeviceId
  ) {
    releasedReference = {
      type: node.nodeType,
      id: node.distributionDeviceId,
      label: node.distributionLabel ?? node.name,
    };
  }

  if (
    node.nodeType === "CUSTOMER" &&
    node.customerId
  ) {
    releasedReference = {
      type: "CUSTOMER",
      id: node.customerId,
      label: node.customerLabel ?? node.name,
    };
  }

  return {
    id: node.id,
    code: node.code,
    releasedReference,
  };
}

/*
 * =========================
 * UPDATE MAP NODE
 * =========================
 */
export async function updateNetworkMapNodeService(
  input: UpdateNetworkTopologyNodeInput,
) {
  const current = await findNetworkTopologyNodeByIdRepository(input.id);

  if (!current) {
    throw new Error("Titik topology tidak ditemukan");
  }

  const duplicate = await findNetworkTopologyNodeByCodeRepository(
    input.code.trim(),
  );

  if (duplicate && duplicate.id !== input.id) {
    throw new Error(`Kode ${input.code} sudah digunakan`);
  }

  const updated = await updateNetworkTopologyNodeRepository({
    id: input.id,
    code: input.code.trim(),
    name: input.name.trim(),
    status: input.status,
    address: input.address?.trim() || null,
    description: input.description?.trim() || null,
  });

  if (!updated) {
    throw new Error("Titik topology gagal diperbarui");
  }

  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    nodeType: updated.nodeType,
    position: {
      lat: Number(updated.latitude),
      lng: Number(updated.longitude),
    },
    status: updated.status,
    address: updated.address,
    description: updated.description,
    routerId: updated.routerId,
    oltId: updated.oltId,
    distributionDeviceId: updated.distributionDeviceId,
    customerId: updated.customerId,
  };
}

function emptyPortSummary():NetworkMapPortSummary{
  return {
    inputTotal:0,
    inputAvailable:0,
    outputTotal:0,
    outputAvailable:0,
    ponTotal:0,
    ponAvailable:0,
  };
}
