import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  fiberCables,
  fiberDistributionDevices,
  networkTopologyNodes,
  networkTopologyPorts,
  olts,
  routers,
} from "@/db/schema";
import type { NetworkTopologyNodeType } from "@/db/schema/network-topology-nodes";

/*
 * =========================
 * LIST TOPOLOGY NODES
 * =========================
 */
export async function listNetworkTopologyNodesRepository() {
  return db
    .select({
      id: networkTopologyNodes.id,
      code: networkTopologyNodes.code,
      name: networkTopologyNodes.name,
      nodeType: networkTopologyNodes.nodeType,
      latitude: networkTopologyNodes.latitude,
      longitude: networkTopologyNodes.longitude,
      status: networkTopologyNodes.status,
      address: networkTopologyNodes.address,
      description: networkTopologyNodes.description,
      routerId: networkTopologyNodes.routerId,
      oltId: networkTopologyNodes.oltId,
      distributionDeviceId: networkTopologyNodes.distributionDeviceId,
      customerId: networkTopologyNodes.customerId,
      customerRxPower:customers.onuReceivePower,
      customerOnuStatus:customers.onuStatus,
      customerRemoteAddress:customers.remoteAddress,
    })
    .from(networkTopologyNodes)
    .orderBy(asc(networkTopologyNodes.code))
    .leftJoin(
      customers,
      eq(networkTopologyNodes.customerId,customers.id),
    );;
}

/*
 * =========================
 * CREATE TOPOLOGY NODE
 * =========================
 */
export type CreateNetworkTopologyNodeRepositoryInput = {
  code: string;
  name: string;
  nodeType: NetworkTopologyNodeType;
  latitude: string;
  longitude: string;
  routerId?: number | null;
  oltId?: number | null;
  distributionDeviceId?: number | null;
  customerId?: number | null;
  address?: string | null;
  description?: string | null;
};

export async function createNetworkTopologyNodeRepository(
  input: CreateNetworkTopologyNodeRepositoryInput,
) {
  const [created] = await db
    .insert(networkTopologyNodes)
    .values({
      code: input.code,
      name: input.name,
      nodeType: input.nodeType,
      latitude: input.latitude,
      longitude: input.longitude,
      routerId: input.routerId ?? null,
      oltId: input.oltId ?? null,
      distributionDeviceId: input.distributionDeviceId ?? null,
      customerId: input.customerId ?? null,
      address: input.address ?? null,
      description: input.description ?? null,
      status: "ACTIVE",
    })
    .returning();

  return created;
}

/*
 * =========================
 * FIND NODE BY CODE
 * =========================
 */
export async function findNetworkTopologyNodeByCodeRepository(code: string) {
  const [row] = await db
    .select({ id: networkTopologyNodes.id })
    .from(networkTopologyNodes)
    .where(eq(networkTopologyNodes.code, code))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * REFERENCE LOOKUPS
 * =========================
 */
export async function findTopologyRouterRepository(id: number) {
  const [row] = await db
    .select({ id: routers.id })
    .from(routers)
    .where(eq(routers.id, id))
    .limit(1);

  return row ?? null;
}

export async function findTopologyOltRepository(id: number) {
  const [row] = await db
    .select({ id: olts.id })
    .from(olts)
    .where(eq(olts.id, id))
    .limit(1);

  return row ?? null;
}

export async function findTopologyDistributionDeviceRepository(id: number) {
  const [row] = await db
    .select({
      id: fiberDistributionDevices.id,
      deviceType: fiberDistributionDevices.deviceType,
    })
    .from(fiberDistributionDevices)
    .where(eq(fiberDistributionDevices.id, id))
    .limit(1);

  return row ?? null;
}

export async function findTopologyCustomerRepository(
  id:number,
){
  const [row]=await db.select({
    id:customers.id,
    name:customers.name,

    /*
     * CUSTOMER INFOBOX
     */
    onuReceivePower:customers.onuReceivePower,
    onuStatus:customers.onuStatus,
    remoteAddress:customers.remoteAddress,
  })
    .from(customers)
    .where(eq(customers.id,id))
    .limit(1);

  return row??null;
}
/*
 * =========================
 * AVAILABLE ROUTERS
 * =========================
 */
export async function listAvailableTopologyRoutersRepository() {
  return db
    .select({
      id: routers.id,
      host: routers.host,
    })
    .from(routers)
    .leftJoin(
      networkTopologyNodes,
      eq(networkTopologyNodes.routerId, routers.id),
    )
    .where(isNull(networkTopologyNodes.id))
    .orderBy(asc(routers.host));
}

/*
 * =========================
 * AVAILABLE OLTS
 * =========================
 */
export async function listAvailableTopologyOltsRepository() {
  return db
    .select({
      id: olts.id,
      name: olts.name,
    })
    .from(olts)
    .leftJoin(
      networkTopologyNodes,
      eq(networkTopologyNodes.oltId, olts.id),
    )
    .where(isNull(networkTopologyNodes.id))
    .orderBy(asc(olts.name));
}

/*
 * =========================
 * AVAILABLE DISTRIBUTION DEVICES
 * =========================
 */
export async function listAvailableTopologyDistributionDevicesRepository() {
  return db
    .select({
      id: fiberDistributionDevices.id,
      name: fiberDistributionDevices.name,
      deviceType: fiberDistributionDevices.deviceType,
    })
    .from(fiberDistributionDevices)
    .leftJoin(
      networkTopologyNodes,
      eq(
        networkTopologyNodes.distributionDeviceId,
        fiberDistributionDevices.id,
      ),
    )
    .where(isNull(networkTopologyNodes.id))
    .orderBy(
      asc(fiberDistributionDevices.deviceType),
      asc(fiberDistributionDevices.name),
    );
}

/*
 * =========================
 * AVAILABLE CUSTOMERS
 * =========================
 */
export async function listAvailableTopologyCustomersRepository() {
  return db
    .select({
      id: customers.id,
      name: customers.name,
    })
    .from(customers)
    .leftJoin(
      networkTopologyNodes,
      eq(networkTopologyNodes.customerId, customers.id),
    )
    .where(isNull(networkTopologyNodes.id))
    .orderBy(asc(customers.name));
}

/*
 * =========================
 * UPDATE NODE POSITION
 * =========================
 */
export async function updateNetworkTopologyNodePositionRepository(
  id: number,
  latitude: string,
  longitude: string,
) {
  const [updated] = await db
    .update(networkTopologyNodes)
    .set({
      latitude,
      longitude,
      updatedAt: new Date(),
    })
    .where(eq(networkTopologyNodes.id, id))
    .returning({
      id: networkTopologyNodes.id,
      latitude: networkTopologyNodes.latitude,
      longitude: networkTopologyNodes.longitude,
    });

  return updated ?? null;
}

/*
 * =========================
 * NODE DELETE CONTEXT
 * =========================
 * Mengambil node beserta label entity sumber
 * sebelum node benar-benar dihapus.
 */
export async function findNetworkTopologyNodeDeleteContextRepository(
  id: number,
) {
  const [row] = await db
    .select({
      id: networkTopologyNodes.id,
      code: networkTopologyNodes.code,
      name: networkTopologyNodes.name,
      nodeType: networkTopologyNodes.nodeType,
      routerId: networkTopologyNodes.routerId,
      oltId: networkTopologyNodes.oltId,
      distributionDeviceId: networkTopologyNodes.distributionDeviceId,
      customerId: networkTopologyNodes.customerId,
      routerLabel: routers.host,
      oltLabel: olts.name,
      distributionLabel: fiberDistributionDevices.name,
      customerLabel: customers.name,
    })
    .from(networkTopologyNodes)
    .leftJoin(routers, eq(networkTopologyNodes.routerId, routers.id))
    .leftJoin(olts, eq(networkTopologyNodes.oltId, olts.id))
    .leftJoin(
      fiberDistributionDevices,
      eq(
        networkTopologyNodes.distributionDeviceId,
        fiberDistributionDevices.id,
      ),
    )
    .leftJoin(
      customers,
      eq(networkTopologyNodes.customerId, customers.id),
    )
    .where(eq(networkTopologyNodes.id, id))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * FIND CONNECTED CABLE
 * =========================
 * Node yang menjadi endpoint kabel fisik
 * tidak boleh dihapus.
 */
export async function findFiberCableUsingNodeRepository(
  nodeId: number,
) {
  const [row] = await db
    .select({
      id: fiberCables.id,
      name: fiberCables.name,
    })
    .from(fiberCables)
    .where(
      or(
        eq(fiberCables.sourceNodeId, nodeId),
        eq(fiberCables.targetNodeId, nodeId),
      ),
    )
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * FIND BLOCKING PORT
 * =========================
 * USED/RESERVED berarti node masih mempunyai
 * resource topology yang tidak aman dihapus.
 */
export async function findBlockingTopologyPortRepository(
  nodeId: number,
) {
  const [row] = await db
    .select({
      id: networkTopologyPorts.id,
      name: networkTopologyPorts.name,
      status: networkTopologyPorts.status,
    })
    .from(networkTopologyPorts)
    .where(
      and(
        eq(networkTopologyPorts.nodeId, nodeId),
        inArray(
          networkTopologyPorts.status,
          ["USED", "RESERVED"],
        ),
      ),
    )
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * DELETE TOPOLOGY NODE
 * =========================
 */
export async function deleteNetworkTopologyNodeRepository(
  id: number,
) {
  const [deleted] = await db
    .delete(networkTopologyNodes)
    .where(eq(networkTopologyNodes.id, id))
    .returning({
      id: networkTopologyNodes.id,
      code: networkTopologyNodes.code,
    });

  return deleted ?? null;
}

/*
 * =========================
 * UPDATE NODE
 * =========================
 */
export async function updateNetworkTopologyNodeRepository(
  input: {
    id: number;
    code: string;
    name: string;
    status: string;
    address: string | null;
    description: string | null;
  },
) {
  const [updated] = await db
    .update(networkTopologyNodes)
    .set({
      code: input.code,
      name: input.name,
      status: input.status,
      address: input.address,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(eq(networkTopologyNodes.id, input.id))
    .returning();

  return updated ?? null;
}

export async function findNetworkTopologyNodeByIdRepository(
  id: number,
) {
  const [row] = await db
    .select()
    .from(networkTopologyNodes)
    .where(eq(networkTopologyNodes.id, id))
    .limit(1);

  return row ?? null;
}

/*
 * =========================
 * AVAILABLE OLTS
 * =========================
 */
export async function listAvailableNetworkMapOltsRepository(){
  return db.select({
    id:olts.id,
    name:olts.name,
    brand:olts.brand,
    model:olts.model,
  })
    .from(olts)
    .leftJoin(
      networkTopologyNodes,
      eq(networkTopologyNodes.oltId,olts.id),
    )
    .where(and(
      eq(olts.isActive,true),
      isNull(networkTopologyNodes.id),
    ))
    .orderBy(olts.name);
}

/*
 * =========================
 * CUSTOMER ONU PORT
 * =========================
 */
export async function findCustomerOnuPortRepository(
  nodeId:number,
){
  const [row]=await db.select({
    id:networkTopologyPorts.id,
    nodeId:networkTopologyPorts.nodeId,
    portNumber:networkTopologyPorts.portNumber,
    name:networkTopologyPorts.name,
    portType:networkTopologyPorts.portType,
    status:networkTopologyPorts.status,
  })
    .from(networkTopologyPorts)
    .where(and(
      eq(networkTopologyPorts.nodeId,nodeId),
      eq(networkTopologyPorts.portNumber,1),
    ))
    .limit(1);

  return row??null;
}

export async function createCustomerOnuPortRepository(
  nodeId:number,
){
  const [row]=await db.insert(networkTopologyPorts)
    .values({
      nodeId,
      oltPonPortId:null,
      portNumber:1,
      name:"ONU-01",
      portType:"INPUT",
      status:"AVAILABLE",
      connectorType:null,
      measuredPowerDbm:null,
      configuredLossDb:null,
      actualLossDb:null,
      splitPercentage:null,
      description:"Customer ONU optical port",
    })
    .returning({
      id:networkTopologyPorts.id,
      nodeId:networkTopologyPorts.nodeId,
      portNumber:networkTopologyPorts.portNumber,
      name:networkTopologyPorts.name,
      portType:networkTopologyPorts.portType,
      status:networkTopologyPorts.status,
    });

  if(!row)
    throw new Error("Gagal membuat port ONU customer");

  return row;
}

export async function ensureCustomerOnuPortRepository(
  nodeId:number,
){
  const existing=
    await findCustomerOnuPortRepository(nodeId);

  if(existing)
    return existing;

  return createCustomerOnuPortRepository(nodeId);
}