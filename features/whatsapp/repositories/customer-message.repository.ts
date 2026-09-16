import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/cusotmers";
import { fiberCables } from "@/db/schema/fiber-cables";
import { networkTopologyLinks } from "@/db/schema/network-topology-links";
import { networkTopologyNodes } from "@/db/schema/network-topology-nodes";

/**
 * ============================================
 * SORT
 * ============================================
 */
export type CustomerMessageSort =
  | "name"
  | "phone"
  | "status";

/**
 * ============================================
 * LIST PARAMS
 * ============================================
 */
type ListParams = {
  q: string;
  page: number;
  pageSize: number | "all";
  sort: CustomerMessageSort;
  order: "asc" | "desc";
  customerIds?: number[];
};

/**
 * ============================================
 * CUSTOMER FIELDS
 * ============================================
 */
const customerFields = {
  id: customers.id,
  name: customers.name,
  phone: customers.phone,
  status: customers.status,
};

/**
 * ============================================
 * LIST CUSTOMER
 * ============================================
 */
export async function listCustomerMessagesRepository({
  q,
  page,
  pageSize,
  sort,
  order,
  customerIds,
}: ListParams) {
  /**
   * ----------------------------------------
   * SEARCH
   * ----------------------------------------
   */
  const searchCondition = q
    ? or(
        ilike(
          customers.name,
          `%${q}%`,
        ),
        ilike(
          customers.phone,
          `%${q}%`,
        ),
      )
    : undefined;

  /**
   * ----------------------------------------
   * TOPOLOGY FILTER
   * ----------------------------------------
   */
  const topologyCondition =
    customerIds === undefined
      ? undefined
      : customerIds.length > 0
        ? inArray(
            customers.id,
            customerIds,
          )
        : sql`false`;

  const condition = and(
    searchCondition,
    topologyCondition,
  );

  /**
   * ----------------------------------------
   * SORT
   * ----------------------------------------
   */
  const sortColumn = {
    name: customers.name,
    phone: customers.phone,
    status: customers.status,
  }[sort];

  const orderBy =
    order === "desc"
      ? desc(sortColumn)
      : asc(sortColumn);

  /**
   * ----------------------------------------
   * TOTAL
   * ----------------------------------------
   */
  const [totalResult] = await db
    .select({
      total: count(),
    })
    .from(customers)
    .where(condition);

  /**
   * ----------------------------------------
   * ALL
   * ----------------------------------------
   */
  if (pageSize === "all") {
    const rows = await db
      .select(customerFields)
      .from(customers)
      .where(condition)
      .orderBy(orderBy);

    return {
      rows,
      total: Number(
        totalResult?.total ??
          0,
      ),
    };
  }

  /**
   * ----------------------------------------
   * PAGINATED
   * ----------------------------------------
   */
  const rows = await db
    .select(customerFields)
    .from(customers)
    .where(condition)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(
      (page - 1) *
        pageSize,
    );

  return {
    rows,
    total: Number(
      totalResult?.total ??
        0,
    ),
  };
}

/**
 * ============================================
 * TOPOLOGY GRAPH
 * ============================================
 *
 * Struktur aktual:
 *
 * network_topology_links.fiberCableId
 *              ↓
 * fiber_cables.id
 *              ↓
 * sourceNodeId / targetNodeId
 */
export async function getCustomerMessageTopologyRepository() {
  /**
   * ----------------------------------------
   * NODES
   * ----------------------------------------
   */
  const nodes = await db
    .select({
      id:
        networkTopologyNodes.id,
      code:
        networkTopologyNodes.code,
      name:
        networkTopologyNodes.name,
      nodeType:
        networkTopologyNodes.nodeType,
      customerId:
        networkTopologyNodes.customerId,
    })
    .from(
      networkTopologyNodes,
    );

  /**
   * ----------------------------------------
   * LINKS
   * ----------------------------------------
   *
   * Endpoint tidak berada langsung di
   * network_topology_links.
   *
   * Kita join:
   *
   * networkTopologyLinks.fiberCableId
   * -> fiberCables.id
   *
   * lalu ambil endpoint dari fiber_cables.
   */
  const links = await db
    .select({
      sourceNodeId:
        fiberCables.sourceNodeId,
      targetNodeId:
        fiberCables.targetNodeId,
    })
    .from(
      networkTopologyLinks,
    )
    .innerJoin(
      fiberCables,
      eq(
        networkTopologyLinks.fiberCableId,
        fiberCables.id,
      ),
    );

  return {
    nodes,
    links,
  };
}