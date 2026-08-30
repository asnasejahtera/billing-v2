import {
  findNetworkMapNodes,
} from "../repositories/network-map.repository";

import type {
  NetworkMapDataDto,
  NetworkMapNodeDto,
} from "../types/network-map.types";

function mapNode(
  row: Awaited<
    ReturnType<
      typeof findNetworkMapNodes
    >
  >[number],
): NetworkMapNodeDto {
  const latitude =
    Number(row.latitude);

  const longitude =
    Number(row.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error(
      `Koordinat node ${row.code} tidak valid`,
    );
  }

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nodeType: row.nodeType,
    latitude,
    longitude,
    address: row.address,
    description: row.description,
  };
}

export async function getNetworkMapData(): Promise<NetworkMapDataDto> {
  const nodes =
    await findNetworkMapNodes();

  return {
    nodes: nodes.map(mapNode),
  };
}