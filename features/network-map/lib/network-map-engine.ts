import {
  createNetworkMapOptions,
} from "./network-map-config";
import {
  getGoogleMapsMapId,
  loadMapsLibrary,
  loadMarkerLibrary,
} from "./google-maps-loader";
import type {
  NetworkMapActionBridge,
  NetworkMapEngine,
  NetworkMapEngineCallbacks,
} from "../types/network-map-runtime.types";
import type {
  MapController,
} from "../types/network-map.types";

type CreateNetworkMapEngineOptions = {
  container: HTMLDivElement;
  callbacks: NetworkMapEngineCallbacks;
};

/*
 * =========================
 * CREATE NETWORK MAP ENGINE
 * =========================
 * Seluruh runtime imperative Google Maps
 * akan hidup di file ini.
 */
export async function createNetworkMapEngine({
  container,
  callbacks,
}: CreateNetworkMapEngineOptions): Promise<NetworkMapEngine> {
  const cleanups: Array<() => void> = [];

  /* =========================
   * LOAD GOOGLE LIBRARIES
   * ========================= */
  const [{ Map, Polyline, InfoWindow }, { AdvancedMarkerElement }] =
    await Promise.all([loadMapsLibrary(), loadMarkerLibrary()]);

  /* =========================
   * CREATE GOOGLE MAP
   * ========================= */
  const map = new Map(
    container,
    createNetworkMapOptions(getGoogleMapsMapId()),
  );

  /* =========================
   * ACTION BRIDGE
   * =========================
   * Function sebenarnya akan dipasang
   * setelah logic existing dipindahkan.
   */
  const actions: NetworkMapActionBridge = {
    placeMarker: null,
    startAddNode: null,
    startDrawing: null,
    startAddWaypoint: null,
    cancelTool: null,
    undoWaypoint: null,
    clearNodeSelection: null,
    clearRouteSelection: null,
    deleteSelectedNode: null,
    deleteWaypoint: null,
    deleteSelectedLink: null,
  };

  /*
   * =====================================================
   * EXISTING GOOGLE MAP ENGINE LOGIC
   * =====================================================
   *
   * Pada langkah 3 seluruh isi initializeMap()
   * lama dipindahkan ke lokasi ini.
   *
   * Jangan mengubah behavior function dahulu.
   */

  /* =========================
   * DESTROY ENGINE
   * ========================= */
  function destroy() {
    for (const cleanup of cleanups) cleanup();

    /* Lepaskan seluruh action supaya React tidak
       memanggil engine yang sudah dihancurkan. */
    actions.placeMarker = null;
    actions.startAddNode = null;
    actions.startDrawing = null;
    actions.startAddWaypoint = null;
    actions.cancelTool = null;
    actions.undoWaypoint = null;
    actions.clearNodeSelection = null;
    actions.clearRouteSelection = null;
    actions.deleteSelectedNode = null;
    actions.deleteWaypoint = null;
    actions.deleteSelectedLink = null;
  }

  return {
    map: map as MapController,
    actions,
    destroy,
  };
}