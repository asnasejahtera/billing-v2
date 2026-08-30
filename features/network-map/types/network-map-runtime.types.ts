import type {
  CompletedRoute,
  Coordinate,
  TemporaryNode,
  MapController,
  SelectedWaypoint,
  ToolMode,
} from "./network-map.types";

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
};

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
  requestDeleteNode: (node: { id: number; code: string }) => void;
  requestDeleteWaypoint: (waypoint: { linkId: number; index: number }) => void;
  requestDeleteLink: (link: {
    id: number;
    sourceCode: string;
    targetCode: string;
  }) => void;
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