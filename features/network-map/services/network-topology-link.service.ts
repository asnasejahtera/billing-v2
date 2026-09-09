import { calculateRouteLength } from "../lib/network-map-geometry";
import {
  createFiberCableRepository,
  createNetworkTopologyLinkRepository,
  createNetworkTopologyLinkWaypointsRepository,
  deleteFiberCableRepository,
  deleteNetworkTopologyLinkRepository,
  findNetworkLinkNodeRepository,
  createFiberCableCoresRepository,
  listNetworkTopologyLinksRepository,
  listNetworkTopologyLinkWaypointsRepository,
  deleteNetworkTopologyLinkWaypointsRepository,
  findNetworkTopologyLinkRouteContextRepository,
  updateNetworkTopologyLinkRouteLengthRepository,
  findFiberCableByNameRepository,
  findNetworkTopologyLinkEditRepository,
  updateFiberCableMetadataRepository,
  updateNetworkTopologyLinkMetadataRepository,
  deleteFiberCableWithTopologyRepository,
  findBlockingFiberCableCoreRepository,
  findFiberCableCoreConnectionRepository,
  findNetworkTopologyLinkDeleteContextRepository,
  findFiberConnectionContextRepository,
  listAvailableFiberCableCoresRepository,
  listAvailableNetworkNodePortsRepository,
  findFiberCableCoreRepository,
  findNetworkTopologyPortRepository,
  findActiveFiberCoreConnectionRepository,
  createFiberCoreConnectionRepository,
  updateNetworkTopologyPortStatusRepository,
  updateFiberCableCoreStatusRepository,
  deleteFiberCoreConnectionRepository,
  listActiveFiberCoreConnectionsRepository,
  findFiberCoreConnectionRepository,
  findOtherActiveFiberConnectionRepository,
  releaseFiberCoreConnectionRepository
} from "../repositories/network-topology-link.repository";

import type {
  UpdateNetworkTopologyLinkInput,
  CreateFiberCoreConnectionInput,
  ReleaseFiberCoreConnectionInput
} from "../schemas/network-topology-link.schema";

import type {
  NetworkMapLinkEditDto,
  NetworkMapFiberConnectionOptions,
  NetworkMapFiberConnectionManagerDto
} from "../types/network-map-persistence.types";

import type {UpdateNetworkTopologyLinkWaypointsInput, } from "../schemas/network-topology-link.schema";
import type { CreateNetworkTopologyLinkInput } from "../schemas/network-topology-link.schema";
import type { NetworkMapLinkDto } from "../types/network-map-persistence.types";
import { createFiberCoreDefinitions } from "../lib/fiber-core-color";

import {ensureNetworkTopologyNodePortsService} from "./network-topology-port.service";
/*
 * =========================
 * CREATE NETWORK LINK
 * =========================
 */
export async function createNetworkTopologyLinkService(
  input: CreateNetworkTopologyLinkInput,
): Promise<NetworkMapLinkDto> {
  if (input.sourceNodeId === input.targetNodeId) {
    throw new Error("Source dan target tidak boleh sama");
  }

  const [source, target] = await Promise.all([
    findNetworkLinkNodeRepository(input.sourceNodeId),
    findNetworkLinkNodeRepository(input.targetNodeId),
  ]);

  if (!source) {
    throw new Error("Source node tidak ditemukan");
  }

  if (!target) {
    throw new Error("Target node tidak ditemukan");
  }

  const sourcePosition = {
    lat: Number(source.latitude),
    lng: Number(source.longitude),
  };

  const targetPosition = {
    lat: Number(target.latitude),
    lng: Number(target.longitude),
  };

  /*
   * Server menghitung ulang route length.
   */
  const routeLengthMeters = calculateRouteLength([
    sourcePosition,
    ...input.waypoints,
    targetPosition,
  ]);

  let cableId: number | null = null;
  let linkId: number | null = null;

  try {
    /*
     * =========================
     * PHYSICAL CABLE
     * =========================
     */
    const cable = await createFiberCableRepository({
      name: input.cableName.trim(),
      cableType: input.cableType?.trim() || null,
      fiberType: input.fiberType?.trim() || null,
      coreCount: input.coreCount,
      sourceNodeId: source.id,
      targetNodeId: target.id,
      estimatedLengthMeters:(input.estimatedLengthMeters ??routeLengthMeters).toFixed(2),
      actualLengthMeters:input.actualLengthMeters != null? input.actualLengthMeters.toFixed(2): null,

      attenuationDbPerKm:
        input.attenuationDbPerKm != null
          ? input.attenuationDbPerKm.toFixed(3)
          : null,
      description: input.description?.trim() || null,
    });

    cableId = cable.id;

    /*
    * =========================
    * FIBER CORES
    * =========================
    */
    const coreDefinitions =
    createFiberCoreDefinitions(
        cable.coreCount,
    );

    await createFiberCableCoresRepository(
    cable.id,
    coreDefinitions,
    );

    /*
     * =========================
     * MAP LINK
     * =========================
     */
    const link =
      await createNetworkTopologyLinkRepository({
        fiberCableId: cable.id,
        routeLengthMeters:
          routeLengthMeters.toFixed(2),
        description:
          input.description?.trim() || null,
      });

    linkId = link.id;

    /*
     * =========================
     * WAYPOINTS
     * =========================
     */
    const createdWaypoints =
      await createNetworkTopologyLinkWaypointsRepository(
        link.id,
        input.waypoints.map((waypoint, index) => ({
          sequence: index + 1,
          latitude: waypoint.lat.toFixed(7),
          longitude: waypoint.lng.toFixed(7),
        })),
      );

    return {
      id: link.id,
      fiberCableId: cable.id,
      cableName: cable.name,
      sourceNodeId: source.id,
      targetNodeId: target.id,
      sourceCode: source.code,
      targetCode: target.code,
      cableType: cable.cableType,
      fiberType: cable.fiberType,
      coreCount: cable.coreCount,
      estimatedLengthMeters:
        cable.estimatedLengthMeters == null
          ? null
          : Number(cable.estimatedLengthMeters),
      actualLengthMeters:
        cable.actualLengthMeters == null
          ? null
          : Number(cable.actualLengthMeters),
      routeLengthMeters,
      attenuationDbPerKm:
        cable.attenuationDbPerKm == null
          ? null
          : Number(cable.attenuationDbPerKm),
      status: link.status,
      description: link.description,
      waypoints: createdWaypoints.map((waypoint) => ({
        id: waypoint.id,
        sequence: waypoint.sequence,
        position: {
          lat: Number(waypoint.latitude),
          lng: Number(waypoint.longitude),
        },
      })),
    };
  } catch (error) {
    /*
     * Neon HTTP tidak kita andalkan untuk transaction
     * pada flow project ini.
     *
     * Jika step berikutnya gagal, cleanup hasil
     * insert sebelumnya.
     */
    if (linkId) {
      try {
        await deleteNetworkTopologyLinkRepository(linkId);
      } catch {}
    }

    if (cableId) {
      try {
        await deleteFiberCableRepository(cableId);
      } catch {}
    }

    throw error;
  }
}

/*
 * =========================
 * LIST NETWORK MAP LINKS
 * =========================
 */
export async function listNetworkMapLinksService(): Promise<NetworkMapLinkDto[]> {
  const links = await listNetworkTopologyLinksRepository();

  if (links.length === 0) return [];

  const waypoints =
    await listNetworkTopologyLinkWaypointsRepository(
      links.map((link) => link.id),
    );

  /*
   * Source/target code kita ambil dari topology node.
   * Tidak menduplikasi code ke fiber cable.
   */
  const nodeIds = [
    ...new Set(
      links.flatMap((link) => [
        link.sourceNodeId,
        link.targetNodeId,
      ]),
    ),
  ];

  const nodes = await Promise.all(
    nodeIds.map((id) =>
      findNetworkLinkNodeRepository(id),
    ),
  );

  const nodeMap = new Map(
    nodes
      .filter((node) => node !== null)
      .map((node) => [
        node.id,
        node,
      ]),
  );

  return links.map((link) => {
    const source = nodeMap.get(
      link.sourceNodeId,
    );

    const target = nodeMap.get(
      link.targetNodeId,
    );

    if (!source || !target) {
      throw new Error(
        `Endpoint fiber link ${link.id} tidak ditemukan`,
      );
    }

    return {
      id: link.id,
      fiberCableId: link.fiberCableId,
      cableName: link.cableName,
      sourceNodeId: link.sourceNodeId,
      targetNodeId: link.targetNodeId,
      sourceCode: source.code,
      targetCode: target.code,
      cableType: link.cableType,
      fiberType: link.fiberType,
      coreCount: link.coreCount,
      estimatedLengthMeters:
        link.estimatedLengthMeters === null
          ? null
          : Number(link.estimatedLengthMeters),
      actualLengthMeters:
        link.actualLengthMeters === null
          ? null
          : Number(link.actualLengthMeters),
      routeLengthMeters:
        link.routeLengthMeters === null
          ? 0
          : Number(link.routeLengthMeters),
      attenuationDbPerKm:
        link.attenuationDbPerKm === null
          ? null
          : Number(link.attenuationDbPerKm),
      status: link.status,
      description: link.description,
      waypoints: waypoints
        .filter(
          (waypoint) =>
            waypoint.linkId === link.id,
        )
        .map((waypoint) => ({
          id: waypoint.id,
          sequence: waypoint.sequence,
          position: {
            lat: Number(waypoint.latitude),
            lng: Number(waypoint.longitude),
          },
        })),
    };
  });
}

/*
 * =========================
 * UPDATE LINK WAYPOINTS
 * =========================
 * Seluruh waypoint disimpan sebagai satu ordered set.
 * Ini mempertahankan model runtime engine yang
 * menggunakan array/index.
 */
export async function updateNetworkTopologyLinkWaypointsService(input: UpdateNetworkTopologyLinkWaypointsInput,) {
  const context =
    await findNetworkTopologyLinkRouteContextRepository(
      input.linkId);
  if (!context) {
    throw new Error("Fiber link tidak ditemukan");
  }

  const [source, target, previousRows] =
    await Promise.all([
      findNetworkLinkNodeRepository(
        context.sourceNodeId,
      ),
      findNetworkLinkNodeRepository(
        context.targetNodeId,
      ),
      listNetworkTopologyLinkWaypointsRepository([
        input.linkId,
      ]),
    ]);

  if (!source || !target) {
    throw new Error(
      "Endpoint fiber link tidak ditemukan",
    );
  }

  const sourcePosition = {
    lat: Number(source.latitude),
    lng: Number(source.longitude),
  };

  const targetPosition = {
    lat: Number(target.latitude),
    lng: Number(target.longitude),
  };

  const routeLengthMeters =
    calculateRouteLength([
      sourcePosition,
      ...input.waypoints,
      targetPosition,
    ]);

  /*
   * Backup digunakan untuk recovery karena
   * project menggunakan Neon HTTP tanpa
   * mengandalkan transaction.
   */
  const previousWaypoints = previousRows
    .sort(
      (a, b) =>
        a.sequence - b.sequence,
    )
    .map((waypoint) => ({
      sequence: waypoint.sequence,
      latitude: waypoint.latitude,
      longitude: waypoint.longitude,
    }));

  const previousRouteLength =
    context.routeLengthMeters;

  try {
    /*
     * Hapus ordered set lama.
     */
    await deleteNetworkTopologyLinkWaypointsRepository(
      input.linkId,
    );

    /*
     * Tulis ordered set baru.
     */
    const created =
      await createNetworkTopologyLinkWaypointsRepository(
        input.linkId,
        input.waypoints.map(
          (waypoint, index) => ({
            sequence: index + 1,
            latitude:
              waypoint.lat.toFixed(7),
            longitude:
              waypoint.lng.toFixed(7),
          }),
        ),
      );

    const updatedLink =
      await updateNetworkTopologyLinkRouteLengthRepository(
        input.linkId,
        routeLengthMeters.toFixed(2),
      );

    if (!updatedLink) {
      throw new Error(
        "Gagal memperbarui panjang fiber link",
      );
    }

    return {
      linkId: input.linkId,
      routeLengthMeters,
      waypoints: created
        .sort(
          (a, b) =>
            a.sequence -
            b.sequence,
        )
        .map((waypoint) => ({
          id: waypoint.id,
          sequence: waypoint.sequence,
          position: {
            lat: Number(
              waypoint.latitude,
            ),
            lng: Number(
              waypoint.longitude,
            ),
          },
        })),
    };
  } catch (error) {
    /*
     * =========================
     * RECOVERY
     * =========================
     */
    try {
      await deleteNetworkTopologyLinkWaypointsRepository(
        input.linkId,
      );

      await createNetworkTopologyLinkWaypointsRepository(
        input.linkId,
        previousWaypoints,
      );

      if (previousRouteLength !== null) {
        await updateNetworkTopologyLinkRouteLengthRepository(
          input.linkId,
          previousRouteLength,
        );
      }
    } catch {
      // Original error tetap diprioritaskan.
    }

    throw error;
  }
}

/*
 * =========================
 * GET LINK EDIT DATA
 * =========================
 */
export async function getNetworkTopologyLinkEditService(
  linkId: number,
): Promise<NetworkMapLinkEditDto> {
  const row =
    await findNetworkTopologyLinkEditRepository(linkId);

  if (!row) {
    throw new Error("Fiber link tidak ditemukan");
  }

  const [source, target] = await Promise.all([
    findNetworkLinkNodeRepository(row.sourceNodeId),
    findNetworkLinkNodeRepository(row.targetNodeId),
  ]);

  if (!source || !target) {
    throw new Error("Endpoint fiber link tidak ditemukan");
  }

  return {
    id: row.id,
    fiberCableId: row.fiberCableId,
    sourceCode: source.code,
    targetCode: target.code,
    cableName: row.cableName,
    cableType: row.cableType,
    fiberType: row.fiberType,
    coreCount: row.coreCount,
    estimatedLengthMeters:
      row.estimatedLengthMeters === null
        ? null
        : Number(row.estimatedLengthMeters),
    actualLengthMeters:
      row.actualLengthMeters === null
        ? null
        : Number(row.actualLengthMeters),
    attenuationDbPerKm:
      row.attenuationDbPerKm === null
        ? null
        : Number(row.attenuationDbPerKm),
    routeLengthMeters:
      row.routeLengthMeters === null
        ? 0
        : Number(row.routeLengthMeters),
    cableDescription: row.cableDescription,
    linkDescription: row.linkDescription,
  };
}

/*
 * =========================
 * UPDATE FIBER LINK
 * =========================
 */
export async function updateNetworkTopologyLinkService(
  input: UpdateNetworkTopologyLinkInput,
) {
  const current =
    await findNetworkTopologyLinkEditRepository(input.id);

  if (!current) {
    throw new Error("Fiber link tidak ditemukan");
  }

  const duplicate =
    await findFiberCableByNameRepository(
      input.cableName.trim(),
    );

  if (
    duplicate &&
    duplicate.id !== current.fiberCableId
  ) {
    throw new Error(
      `Nama kabel ${input.cableName} sudah digunakan`,
    );
  }

  /*
   * Backup untuk compensating rollback.
   */
  const previousCable = {
    name: current.cableName,
    cableType: current.cableType,
    fiberType: current.fiberType,
    estimatedLengthMeters:
      current.estimatedLengthMeters,
    actualLengthMeters:
      current.actualLengthMeters,
    attenuationDbPerKm:
      current.attenuationDbPerKm,
    description:
      current.cableDescription,
  };

  try {
    const cable =
      await updateFiberCableMetadataRepository(
        current.fiberCableId,
        {
          name: input.cableName.trim(),
          cableType:
            input.cableType?.trim() || null,
          fiberType:
            input.fiberType?.trim() || null,
          estimatedLengthMeters:
            input.estimatedLengthMeters != null
              ? input.estimatedLengthMeters.toFixed(2)
              : null,
          actualLengthMeters:
            input.actualLengthMeters != null
              ? input.actualLengthMeters.toFixed(2)
              : null,
          attenuationDbPerKm:
            input.attenuationDbPerKm != null
              ? input.attenuationDbPerKm.toFixed(3)
              : null,
          description:
            input.cableDescription?.trim() || null,
        },
      );

    if (!cable) {
      throw new Error(
        "Gagal memperbarui data kabel",
      );
    }

    const link =
      await updateNetworkTopologyLinkMetadataRepository(
        input.id,
        input.linkDescription?.trim() || null,
      );

    if (!link) {
      throw new Error(
        "Gagal memperbarui data link",
      );
    }
  } catch (error) {
    /*
     * =========================
     * ROLLBACK CABLE
     * =========================
     */
    try {
      await updateFiberCableMetadataRepository(
        current.fiberCableId,
        previousCable,
      );

      await updateNetworkTopologyLinkMetadataRepository(
        input.id,
        current.linkDescription,
      );
    } catch {}

    throw error;
  }

  return getNetworkTopologyLinkEditService(
    input.id,
  );
}

/*
 * =========================
 * SAFE DELETE FIBER LINK
 * =========================
 */
export async function deleteNetworkTopologyLinkService(
  linkId: number,
) {
  const context =
    await findNetworkTopologyLinkDeleteContextRepository(
      linkId,
    );

  if (!context) {
    throw new Error("Fiber link tidak ditemukan");
  }

  /*
   * =========================
   * CORE STATUS SAFETY
   * =========================
   */
  const blockingCore =
    await findBlockingFiberCableCoreRepository(
      context.fiberCableId,
    );

  if (blockingCore) {
    throw new Error(
      `Kabel ${context.cableName} masih memiliki core ${blockingCore.coreNumber} dengan status ${blockingCore.status}.`,
    );
  }

  /*
   * =========================
   * CONNECTION HISTORY SAFETY
   * =========================
   */
  const connection =
    await findFiberCableCoreConnectionRepository(
      context.fiberCableId,
    );

  // if (connection) {
  //   throw new Error(
  //     `Kabel ${context.cableName} sudah memiliki riwayat koneksi core dan tidak boleh dihapus permanen.`,
  //   );
  // }

  const [source, target] = await Promise.all([
    findNetworkLinkNodeRepository(
      context.sourceNodeId,
    ),
    findNetworkLinkNodeRepository(
      context.targetNodeId,
    ),
  ]);

  /*
   * Satu DELETE physical cable.
   * Database cascade membersihkan link,
   * waypoint dan core.
   */
  try {
    const deleted =
      await deleteFiberCableWithTopologyRepository(
        context.fiberCableId,
      );

    if (!deleted) {
      throw new Error(
        "Fiber cable gagal dihapus",
      );
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23503"
    ) {
      throw new Error(
        `Kabel ${context.cableName} masih digunakan oleh data jaringan lain.`,
      );
    }

    throw error;
  }

  return {
    id: context.id,
    fiberCableId: context.fiberCableId,
    cableName: context.cableName,
    sourceCode: source?.code ?? "Source",
    targetCode: target?.code ?? "Target",
  };
}

/*
 * =========================
 * FIBER CONNECTION OPTIONS
 * =========================
 */
export async function getNetworkMapFiberConnectionOptionsService(
  linkId:number,
):Promise<NetworkMapFiberConnectionOptions>{
  const context=await findFiberConnectionContextRepository(linkId);
  if(!context) throw new Error("Fiber link tidak ditemukan");

  await Promise.all([
    ensureNetworkTopologyNodePortsService(context.sourceNodeId),
    ensureNetworkTopologyNodePortsService(context.targetNodeId),
  ]);

  const [sourcePorts,targetPorts,cores]=await Promise.all([
    listAvailableNetworkNodePortsRepository(context.sourceNodeId),
    listAvailableNetworkNodePortsRepository(context.targetNodeId),
    listAvailableFiberCableCoresRepository(context.fiberCableId),
  ]);

  return {
    linkId:context.linkId,
    fiberCableId:context.fiberCableId,
    sourceNodeId:context.sourceNodeId,
    targetNodeId:context.targetNodeId,
    sourcePorts,
    targetPorts,
    cores,
  };
}

/*
 * =========================
 * CREATE FIBER CORE CONNECTION
 * =========================
 */
export async function createFiberCoreConnectionService(
  input:CreateFiberCoreConnectionInput,
){
  const context=await findFiberConnectionContextRepository(input.linkId);
  if(!context) throw new Error("Fiber link tidak ditemukan");

  const [core,sourcePort,targetPort]=await Promise.all([
    findFiberCableCoreRepository(input.coreId),
    findNetworkTopologyPortRepository(input.sourcePortId),
    findNetworkTopologyPortRepository(input.targetPortId),
  ]);

  if(!core) throw new Error("Fiber core tidak ditemukan");
  if(!sourcePort) throw new Error("Source port tidak ditemukan");
  if(!targetPort) throw new Error("Target port tidak ditemukan");

  /*
   * =========================
   * RELATION VALIDATION
   * =========================
   */
  if(core.cableId!==context.fiberCableId)
    throw new Error("Fiber core bukan milik kabel pada jalur ini");
  if(sourcePort.nodeId!==context.sourceNodeId)
    throw new Error("Source port bukan milik source node jalur");
  if(targetPort.nodeId!==context.targetNodeId)
    throw new Error("Target port bukan milik target node jalur");
  if(sourcePort.id===targetPort.id)
    throw new Error("Source port dan target port tidak boleh sama");

  /*
   * =========================
   * STATUS VALIDATION
   * =========================
   */
  if(core.status!=="AVAILABLE")
    throw new Error(`Core ${core.coreNumber} tidak tersedia`);
  if(sourcePort.status!=="AVAILABLE")
    throw new Error(`Port ${sourcePort.name} tidak tersedia`);
  if(targetPort.status!=="AVAILABLE")
    throw new Error(`Port ${targetPort.name} tidak tersedia`);

  const existing=await findActiveFiberCoreConnectionRepository({
    coreId:core.id,
    sourcePortId:sourcePort.id,
    targetPortId:targetPort.id,
  });

  if(existing)
    throw new Error("Core atau port sudah mempunyai koneksi aktif");

  /*
   * =========================
   * CREATE CONNECTION
   * =========================
   */
  let connection:null|Awaited<ReturnType<typeof createFiberCoreConnectionRepository>>=null;

  try{
    connection=await createFiberCoreConnectionRepository({
      coreId:core.id,
      sourcePortId:sourcePort.id,
      targetPortId:targetPort.id,
    });

    if(!connection) throw new Error("Gagal membuat fiber core connection");

    const [sourceUpdated,targetUpdated,coreUpdated]=await Promise.all([
      updateNetworkTopologyPortStatusRepository(sourcePort.id,"USED"),
      updateNetworkTopologyPortStatusRepository(targetPort.id,"USED"),
      updateFiberCableCoreStatusRepository(core.id,"USED"),
    ]);

    if(!sourceUpdated||!targetUpdated||!coreUpdated)
      throw new Error("Gagal memperbarui status core atau port");

    return {
      id:connection.id,
      linkId:context.linkId,
      fiberCableId:context.fiberCableId,
      coreId:core.id,
      coreNumber:core.coreNumber,
      coreColor:core.color,
      sourceNodeId:context.sourceNodeId,
      sourcePortId:sourcePort.id,
      sourcePortName:sourcePort.name,
      targetNodeId:context.targetNodeId,
      targetPortId:targetPort.id,
      targetPortName:targetPort.name,
      status:"ACTIVE" as const,
    };
  }catch(error){
    if(connection){
      try{
        await deleteFiberCoreConnectionRepository(connection.id);
        await Promise.all([
          updateNetworkTopologyPortStatusRepository(sourcePort.id,"AVAILABLE"),
          updateNetworkTopologyPortStatusRepository(targetPort.id,"AVAILABLE"),
          updateFiberCableCoreStatusRepository(core.id,"AVAILABLE"),
        ]);
      }catch{}
    }
    throw error;
  }
}


/*
 * =========================
 * FIBER CONNECTION MANAGER
 * =========================
 */
export async function getNetworkMapFiberConnectionManagerService(
  linkId:number,
):Promise<NetworkMapFiberConnectionManagerDto>{
  const context=await findFiberConnectionContextRepository(linkId);
  if(!context) throw new Error("Fiber link tidak ditemukan");

  /*
   * Provision port lebih dulu.
   * Ini juga memperbaiki node lama yang dibuat
   * sebelum Port Foundation tersedia.
   */
  await Promise.all([
    ensureNetworkTopologyNodePortsService(context.sourceNodeId),
    ensureNetworkTopologyNodePortsService(context.targetNodeId),
  ]);

  const [sourcePorts,targetPorts,cores,connections]=await Promise.all([
    listAvailableNetworkNodePortsRepository(context.sourceNodeId),
    listAvailableNetworkNodePortsRepository(context.targetNodeId),
    listAvailableFiberCableCoresRepository(context.fiberCableId),
    listActiveFiberCoreConnectionsRepository(context.fiberCableId),
  ]);

  return {
    linkId:context.linkId,
    fiberCableId:context.fiberCableId,
    sourceNodeId:context.sourceNodeId,
    targetNodeId:context.targetNodeId,
    sourcePorts,
    targetPorts,
    cores,
    connections:connections.map((item)=>({
      id:item.id,
      linkId:context.linkId,
      fiberCableId:context.fiberCableId,
      coreId:item.coreId,
      coreNumber:item.coreNumber,
      coreColor:item.coreColor,
      sourceNodeId:item.sourceNodeId,
      sourcePortId:item.sourcePortId,
      sourcePortName:item.sourcePortName,
      targetNodeId:item.targetNodeId,
      targetPortId:item.targetPortId,
      targetPortName:item.targetPortName,
      status:item.status,
      description:item.description,
      connectedAt:item.connectedAt.toISOString(),
    })),
  };
}

/*
 * =========================
 * SAFE RELEASE CONNECTION
 * =========================
 */
export async function releaseFiberCoreConnectionService(
  input:ReleaseFiberCoreConnectionInput,
){
  const connection=await findFiberCoreConnectionRepository(input.id);

  if(!connection)
    throw new Error("Fiber core connection tidak ditemukan");

  if(connection.status!=="ACTIVE")
    throw new Error("Fiber core connection sudah tidak aktif");

  const conflict=await findOtherActiveFiberConnectionRepository({
    connectionId:connection.id,
    coreId:connection.coreId,
    sourcePortId:connection.sourcePortId,
    targetPortId:connection.targetPortId,
  });

  if(conflict)
    throw new Error("Core atau port masih digunakan connection aktif lain");

  /*
   * =========================
   * RELEASE RESOURCE FIRST
   * =========================
   * Connection masih ACTIVE selama status resource
   * diperbarui, sehingga create baru tetap ditolak
   * oleh active-connection validation.
   */
  try{
    const [sourcePort,targetPort,core]=await Promise.all([
      updateNetworkTopologyPortStatusRepository(connection.sourcePortId,"AVAILABLE"),
      updateNetworkTopologyPortStatusRepository(connection.targetPortId,"AVAILABLE"),
      updateFiberCableCoreStatusRepository(connection.coreId,"AVAILABLE"),
    ]);

    if(!sourcePort||!targetPort||!core)
      throw new Error("Gagal membebaskan core atau port");

    const released=await releaseFiberCoreConnectionRepository(connection.id);

    if(!released)
      throw new Error("Gagal me-release fiber core connection");

    return {
      id:connection.id,
      fiberCableId:connection.cableId,
      coreId:connection.coreId,
      coreNumber:connection.coreNumber,
      sourcePortId:connection.sourcePortId,
      sourcePortName:connection.sourcePortName,
      targetPortId:connection.targetPortId,
      targetPortName:connection.targetPortName,
      status:"RELEASED" as const,
      releasedAt:released.releasedAt?.toISOString()??null,
    };
  }catch(error){
    /*
     * =========================
     * COMPENSATING ROLLBACK
     * =========================
     */
    try{
      await Promise.all([
        updateNetworkTopologyPortStatusRepository(connection.sourcePortId,"USED"),
        updateNetworkTopologyPortStatusRepository(connection.targetPortId,"USED"),
        updateFiberCableCoreStatusRepository(connection.coreId,"USED"),
      ]);
    }catch{}

    throw error;
  }
}