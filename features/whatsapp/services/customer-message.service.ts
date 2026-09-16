import {
  normalizeWhatsAppPhone,
} from "../lib/normalize-whatsapp-phone";

import {
  getCustomerMessageTopologyRepository,
  listCustomerMessagesRepository,
  type CustomerMessageSort,
} from "../repositories/customer-message.repository";

import type {
  CustomerMessageFilterOption,
  CustomerMessagePageResult,
} from "../types/customer-message.types";

/**
 * ============================================
 * PARAMS
 * ============================================
 */
type Params = {
  q?: string;
  page?: string | number;
  pageSize?: string | number;
  sort?: string;
  order?: string;

  oltId?: string | number;
  odcId?: string | number;
  odpId?: string | number;
};

/**
 * ============================================
 * PARSE ID
 * ============================================
 */
function parseId(
  value:
    | string
    | number
    | undefined,
): number | null {
  const id =
    Number(
      value,
    );

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

/**
 * ============================================
 * GET DESCENDANTS
 * ============================================
 *
 * Traversal hanya source → target.
 */
function getDescendantIds(
  startId: number,
  links: {
    sourceNodeId: number;
    targetNodeId: number;
  }[],
): Set<number> {
  const adjacency =
    new Map<
      number,
      number[]
    >();

  for (
    const link of
    links
  ) {
    const targets =
      adjacency.get(
        link.sourceNodeId,
      ) ?? [];

    targets.push(
      link.targetNodeId,
    );

    adjacency.set(
      link.sourceNodeId,
      targets,
    );
  }

  const visited =
    new Set<number>();

  const queue: number[] = [
    startId,
  ];

  while (
    queue.length
  ) {
    const current =
      queue.shift();

    if (
      current ===
        undefined ||
      visited.has(
        current,
      )
    ) {
      continue;
    }

    visited.add(
      current,
    );

    for (
      const child of
      adjacency.get(
        current,
      ) ?? []
    ) {
      if (
        !visited.has(
          child,
        )
      ) {
        queue.push(
          child,
        );
      }
    }
  }

  return visited;
}

/**
 * ============================================
 * FILTER OPTIONS
 * ============================================
 */
function mapOptions(
  nodes: {
    id: number;
    code: string;
    name: string;
  }[],
): CustomerMessageFilterOption[] {
  return nodes
    .map(
      (node) => ({
        id:
          node.id,
        code:
          node.code,
        name:
          node.name,
      }),
    )
    .sort(
      (a, b) =>
        a.code.localeCompare(
          b.code,
        ),
    );
}

/**
 * ============================================
 * CUSTOMER MESSAGE PAGE
 * ============================================
 */
export async function getCustomerMessagePageService(
  params: Params,
): Promise<CustomerMessagePageResult> {
  /**
   * ----------------------------------------
   * BASIC PARAMS
   * ----------------------------------------
   */
  const q =
    params.q?.trim() ??
    "";

  const requestedPage =
    Number(
      params.page ??
        1,
    );

  const page =
    Number.isInteger(
      requestedPage,
    ) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  /**
   * ----------------------------------------
   * PAGE SIZE
   * ----------------------------------------
   */
  const requestedPageSize =
    String(
      params.pageSize ??
        "20",
    );

  const allowedPageSizes = [
    10,
    20,
    50,
    100,
  ];

  const pageSize:
    | number
    | "all" =
    requestedPageSize ===
    "all"
      ? "all"
      : allowedPageSizes.includes(
            Number(
              requestedPageSize,
            ),
          )
        ? Number(
            requestedPageSize,
          )
        : 20;

  /**
   * ----------------------------------------
   * SORT
   * ----------------------------------------
   */
  const allowedSort:
    CustomerMessageSort[] = [
      "name",
      "phone",
      "status",
    ];

  const sort:
    CustomerMessageSort =
    allowedSort.includes(
      params.sort as CustomerMessageSort,
    )
      ? (
          params.sort as CustomerMessageSort
        )
      : "name";

  const order:
    | "asc"
    | "desc" =
    params.order ===
    "desc"
      ? "desc"
      : "asc";

  /**
   * ========================================
   * TOPOLOGY
   * ========================================
   */
  const topology =
    await getCustomerMessageTopologyRepository();

  /**
   * ----------------------------------------
   * ALL OLT
   * ----------------------------------------
   */
  const oltNodes =
    topology.nodes.filter(
      (node) =>
        node.nodeType ===
        "OLT",
    );

  const requestedOltId =
    parseId(
      params.oltId,
    );

  const oltId =
    requestedOltId &&
    oltNodes.some(
      (node) =>
        node.id ===
        requestedOltId,
    )
      ? requestedOltId
      : null;

  /**
   * ----------------------------------------
   * ODC OPTIONS
   * ----------------------------------------
   */
  const oltDescendants =
    oltId
      ? getDescendantIds(
          oltId,
          topology.links,
        )
      : null;

  const odcNodes =
    topology.nodes.filter(
      (node) =>
        node.nodeType ===
          "ODC" &&
        (
          !oltDescendants ||
          oltDescendants.has(
            node.id,
          )
        ),
    );

  const requestedOdcId =
    parseId(
      params.odcId,
    );

  const odcId =
    requestedOdcId &&
    odcNodes.some(
      (node) =>
        node.id ===
        requestedOdcId,
    )
      ? requestedOdcId
      : null;

  /**
   * ----------------------------------------
   * ODP OPTIONS
   * ----------------------------------------
   */
  const odpParentId =
    odcId ??
    oltId;

  const odpDescendants =
    odpParentId
      ? getDescendantIds(
          odpParentId,
          topology.links,
        )
      : null;

  const odpNodes =
    topology.nodes.filter(
      (node) =>
        node.nodeType ===
          "ODP" &&
        (
          !odpDescendants ||
          odpDescendants.has(
            node.id,
          )
        ),
    );

  const requestedOdpId =
    parseId(
      params.odpId,
    );

  const odpId =
    requestedOdpId &&
    odpNodes.some(
      (node) =>
        node.id ===
        requestedOdpId,
    )
      ? requestedOdpId
      : null;

  /**
   * ----------------------------------------
   * CUSTOMER FILTER
   * ----------------------------------------
   *
   * Prioritas:
   *
   * ODP > ODC > OLT
   */
  const selectedNodeId =
    odpId ??
    odcId ??
    oltId;

  let customerIds:
    | number[]
    | undefined;

  if (
    selectedNodeId
  ) {
    const descendants =
      getDescendantIds(
        selectedNodeId,
        topology.links,
      );

    customerIds =
      topology.nodes
        .filter(
          (node) =>
            node.nodeType ===
              "CUSTOMER" &&
            node.customerId !==
              null &&
            descendants.has(
              node.id,
            ),
        )
        .map(
          (node) =>
            node.customerId,
        )
        .filter(
          (
            id,
          ): id is number =>
            id !== null,
        );

    customerIds = [
      ...new Set(
        customerIds,
      ),
    ];
  }

  /**
   * ========================================
   * CUSTOMER QUERY
   * ========================================
   */
  const result =
    await listCustomerMessagesRepository({
      q,
      page:
        pageSize ===
        "all"
          ? 1
          : page,
      pageSize,
      sort,
      order,
      customerIds,
    });

  /**
   * ----------------------------------------
   * NORMALIZE WHATSAPP
   * ----------------------------------------
   */
  const data =
    result.rows.map(
      (customer) => {
        const whatsappPhone =
          normalizeWhatsAppPhone(
            customer.phone,
          );

        return {
          id:
            customer.id,
          name:
            customer.name,
          phone:
            customer.phone,
          whatsappPhone,
          status:
            customer.status,
          validWhatsApp:
            whatsappPhone !==
            null,
        };
      },
    );

  /**
   * ========================================
   * RESULT
   * ========================================
   */
  return {
    data,

    page:
      pageSize ===
      "all"
        ? 1
        : page,

    pageSize,

    total:
      result.total,

    totalPages:
      pageSize ===
      "all"
        ? 1
        : Math.max(
            1,
            Math.ceil(
              result.total /
                pageSize,
            ),
          ),

    filters: {
      olts:
        mapOptions(
          oltNodes,
        ),

      odcs:
        mapOptions(
          odcNodes,
        ),

      odps:
        mapOptions(
          odpNodes,
        ),

      oltId,
      odcId,
      odpId,
    },
  };
}