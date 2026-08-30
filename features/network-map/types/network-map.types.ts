import type {
  NetworkTopologyNodeType,
} from "@/db/schema/network-topology-nodes";

export type NetworkMapNodeDto = {
  id: number;
  code: string;
  name: string;
  nodeType: NetworkTopologyNodeType;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
};

export type NetworkMapDataDto = {
  nodes: NetworkMapNodeDto[];
};

/*
 * =========================
 * NETWORK MAP SHARED TYPES
 * =========================
 *
 * Type yang digunakan oleh beberapa
 * bagian Network Map dipisahkan dari
 * network-google-map.tsx agar component
 * utama tidak menjadi terlalu besar.
 */

/*
 * =========================
 * COORDINATE
 * =========================
 */
export type Coordinate = {
  lat: number;
  lng: number;
};

/*
 * =========================
 * MAP CONTROLLER
 * =========================
 *
 * Hanya method Google Map yang
 * saat ini benar-benar digunakan
 * oleh component.
 */
export type MapController = {
  panTo: (position: Coordinate) => void;
  setCenter: (position: Coordinate) => void;
  setZoom: (zoom: number) => void;
  setOptions: (options: object) => void;
};

/*
 * =========================
 * MAP TOOL MODE
 * =========================
 */
export type ToolMode =
  | "NORMAL"
  | "ADD_NODE"
  | "DRAW_LINK"
  | "ADD_WAYPOINT";

/*
 * =========================
 * TEMPORARY NODE
 * =========================
 *
 * Masih in-memory.
 * Nanti type persistence/database
 * akan dibuat terpisah.
 */
export type TemporaryNode = {
  id: number;
  code: string;
  position: Coordinate;
  element: HTMLDivElement;
  remove: () => void;
};

/*
 * =========================
 * SELECTED NODE
 * =========================
 */
export type SelectedNode = {
  id: number;
  code: string;
  position: Coordinate;
};

/*
 * =========================
 * COMPLETED ROUTE
 * =========================
 */
export type CompletedRoute = {
  linkId: number;
  sourceCode: string;
  targetCode: string;
  waypointCount: number;
  pointCount: number;
  lengthMeters: number;
};

/*
 * =========================
 * SELECTED WAYPOINT
 * =========================
 */
export type SelectedWaypoint = {
  linkId: number;
  index: number;
  position: Coordinate;
};