import type {
  CompletedRoute,
  Coordinate,
  TemporaryNode,
  MapController,
  SelectedWaypoint,
  ToolMode,
  NetworkMapSearchResult,
} from "./network-map.types";

import type {
  NetworkMapLinkDraft,
  NetworkMapLinkDto,
  NetworkMapNodeDto,
  NetworkMapPortSummary
} from "./network-map-persistence.types";


/*
 * =========================
 * TEMPORARY LINK RUNTIME
 * =========================
 * Generic agar type ini tidak bergantung langsung
 * pada Google Maps Polyline di luar component.
 */
export type TemporaryLink<TPolyline> = {
  id: number;
  sourceNode: TemporaryNode;
  targetNode: TemporaryNode;
  waypoints: Coordinate[];
  polyline: TPolyline;
  routeInfo: CompletedRoute;
  remove: () => void;
};

/*
 * =========================
 * WAYPOINT MARKER RUNTIME
 * =========================
 */
export type SelectedWaypointMarker<TMarker> = {
  marker: TMarker;
  remove: () => void;
};

/*
 * =========================
 * MAP ACTION BRIDGE
 * =========================
 * Jembatan antara React UI dan Google Maps engine.
 * Function diisi setelah initializeMap() selesai.
 */
export type NetworkMapActionBridge = {
  placeMarker: ((coordinate: Coordinate) => void) | null;
  startAddNode: (() => void) | null;
  startDrawing: (() => void) | null;
  startAddWaypoint: (() => void) | null;
  cancelTool: (() => void) | null;
  undoWaypoint: (() => void) | null;
  clearNodeSelection: (() => void) | null;
  clearRouteSelection: (() => void) | null;
  deleteSelectedNode: ((nodeId: number) => void) | null;
  deleteWaypoint: ((linkId: number, waypointIndex: number) => void) | null;
  deleteSelectedLink: ((linkId: number) => void) | null;
  searchNodes: ((query: string) => NetworkMapSearchResult[]) | null;
  focusNode: ((nodeId: number) => void) | null;

  addPersistedNode: ((node: NetworkMapNodeDto) => void) | null;
  updatePersistedNode: ((node: NetworkMapNodeDto) => void) | null;
  updateNodePortSummary:
  |((nodeId:number,portSummary:NetworkMapPortSummary)=>void)
  |null;
};

export type NetworkMapNodePositionUpdateResult =| {success: true;position: Coordinate;}| {success: false;message: string;};

/*
 * =========================
 * MAP ENGINE CALLBACKS
 * =========================
 * Engine tidak memiliki React state.
 * Perubahan UI dikirim melalui callback.
 */
export type NetworkMapEngineCallbacks = {
  setToolMode: (mode: ToolMode) => void;
  setInstruction: (value: string | null) => void;
  setNodeCount: (value: number) => void;
  setWaypointCount: (value: number) => void;
  setSelectedCoordinate: (value: Coordinate | null) => void;
  setSelectedPointLabel: (value: string | null) => void;
  setCompletedRoute: (
    value:
      | CompletedRoute
      | null
      | ((current: CompletedRoute | null) => CompletedRoute | null),
  ) => void;
  setSelectedWaypoint: (
    value:
      | SelectedWaypoint
      | null
      | ((current: SelectedWaypoint | null) => SelectedWaypoint | null),
  ) => void;
  persistNodePosition: (input: {
    id: number;
    position: Coordinate;
  }) => Promise<NetworkMapNodePositionUpdateResult>;requestEditNode: (node: NetworkMapNodeEditTarget) => void;
  requestEditLink: (linkId: number) => void;
  requestCreateNode: (coordinate: Coordinate) => void;
  requestDeleteNode: (node: { id: number; code: string }) => void;
  requestCreateLink: (draft: NetworkMapLinkDraft) => Promise<NetworkMapLinkDto | null>;
  requestDeleteWaypoint: (waypoint: { linkId: number; index: number }) => void;
  requestNodeDetail:(node:NetworkMapNodeDetailTarget)=>void;
  requestDeleteLink: (link: {
    id: number;
    sourceCode: string;
    targetCode: string;
  }) => void;
  persistLinkWaypoints: (input: {
    linkId: number;
    waypoints: Coordinate[];
  }) => Promise<PersistLinkWaypointsResult>;
  requestManageFiberCores:(linkId:number)=>void;
};

/*
 * =========================
 * NETWORK MAP ENGINE
 * =========================
 */
export type NetworkMapEngine = {
  map: MapController;
  actions: NetworkMapActionBridge;
  destroy: () => void;
};

export type PersistLinkWaypointsResult =
  | {
      success: true;
      waypoints: Coordinate[];
      routeLengthMeters: number;
    }
  | {
      success: false;
      message: string;
    };

  /*
 * =========================
 * NODE DETAIL TARGET
 * =========================
 */
export type NetworkMapNodeDetailTarget={
  id:number;
  code:string;
  name:string;
  nodeType:string;
  status:string;
  position:Coordinate;
  address:string|null;
  description:string|null;
};

export type NetworkMapNodeEditTarget={
  id:number;
  code:string;
  name:string;
  nodeType:string;
  status:string;
  address:string|null;
  description:string|null;
};