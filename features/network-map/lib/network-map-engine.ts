import {createNetworkMapOptions,} from "./network-map-config";

import {
  getGoogleMapsMapId,
  loadMapsLibrary,
  loadMarkerLibrary,
} from "./google-maps-loader";

import type {
  NetworkMapActionBridge,
  NetworkMapEngine,
  NetworkMapEngineCallbacks,
  NetworkMapNodeTypeFilter,
  NetworkMapNodeStatusFilter,
  SelectedWaypointMarker as RuntimeSelectedWaypointMarker,
  TemporaryLink as RuntimeTemporaryLink,
} from "../types/network-map-runtime.types";

import type {
  MapController,
  Coordinate,
  TemporaryNode,
  ToolMode
} from "../types/network-map.types";

import type {
  NetworkMapNodeDto,
  NetworkMapLinkDraft,
  NetworkMapLinkDto,
  NetworkMapPortSummary,
  NetworkMapCustomerInfo
} from "../types/network-map-persistence.types";
import {
  calculateRouteLength,
  findNearestSegmentIndex,
  getRouteMidpoint,
} from "./network-map-geometry";

import {
  findById,
  removeById,
} from "./network-map-registry";

import { createNodeInfoWindowContent } from "./network-map-info-window-content";
import { createRouteInfoWindowContent } from "./route-info-window-content";
import { createWaypointInfoWindowContent } from "./waypoint-info-window-content";
import {
  applyNodeBaseStyle,
  createNodeElement,
  createWaypointElement,
  resetNodeElement,
  selectNodeElement,
  sourceNodeElement,
} from "./network-map-marker-elements";



type CreateNetworkMapEngineOptions = {
  container: HTMLDivElement;
  initialNodes?: NetworkMapNodeDto[];
  initialLinks?: NetworkMapLinkDto[];
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
  initialNodes = [],
  initialLinks = [],
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
    searchNodes: null,
    focusNode: null,
    addPersistedNode: null,
    updatePersistedNode: null,
    updateNodePortSummary: null,
    filterNodeType:null,
    filterNodeStatus:null,
  };

  /*
  * =========================
  * NODE INFO WINDOW
  * =========================
  * Satu InfoWindow digunakan ulang
  * untuk seluruh network node.
  */
  const nodeInfoWindow = new InfoWindow();
  let nodeInfoContentCleanup: (() => void) | null = null;

  /*
  * =========================
  * CLOSE NODE INFO CONTENT
  * =========================
  * Membersihkan event listener DOM
  * milik content InfoWindow sebelumnya.
  */
  function closeNodeInfoContent() {
    nodeInfoContentCleanup?.();
    nodeInfoContentCleanup = null;
  }

  /*
  * =========================
  * NODE INFO WINDOW CLEANUP
  * =========================
  * Cleanup final ketika engine dihancurkan.
  */
  cleanups.push(() => {
    closeNodeInfoContent();
    nodeInfoWindow.close();
  });

  /*
  * =========================
  * WAYPOINT INFO WINDOW
  * =========================
  * Satu instance dipakai ulang untuk seluruh
  * waypoint dari route yang sedang selected.
  */
  const waypointInfoWindow = new InfoWindow();
  let waypointInfoContentCleanup: (() => void) | null = null;

  /*
  * =========================
  * CLOSE WAYPOINT INFO CONTENT
  * =========================
  * Membersihkan listener DOM content waypoint
  * sebelum content baru dipasang.
  */
  function closeWaypointInfoContent() {
    waypointInfoContentCleanup?.();
    waypointInfoContentCleanup = null;
  }

  /*
  * =========================
  * WAYPOINT INFO WINDOW CLEANUP
  * =========================
  */
  cleanups.push(() => {
    closeWaypointInfoContent();
    waypointInfoWindow.close();
  });

  /*
  * =========================
  * ROUTE INFO WINDOW
  * =========================
  * Route tidak mempunyai marker anchor.
  * Posisi InfoWindow disimpan dari titik klik
  * atau midpoint route.
  */
  const routeInfoWindow = new InfoWindow();
  let routeInfoContentCleanup: (() => void) | null = null;
  let routeInfoPosition: Coordinate | null = null;

  /*
  * =========================
  * CLOSE ROUTE INFO CONTENT
  * =========================
  * Membersihkan event listener DOM milik
  * content Route InfoWindow sebelumnya.
  */
  function closeRouteInfoContent() {
    routeInfoContentCleanup?.();
    routeInfoContentCleanup = null;
  }

  /*
  * =========================
  * ROUTE INFO WINDOW CLEANUP
  * =========================
  */
  cleanups.push(() => {
    closeRouteInfoContent();
    routeInfoWindow.close();
    routeInfoPosition = null;
  });

  /*
  * =========================
  * TEMPORARY NODE REGISTRY
  * =========================
  * Menyimpan seluruh node temporary
  * yang hidup selama map aktif.
  */
  const nodes: TemporaryNode[] = [];
  const nodeMarkers: Array<
    InstanceType<typeof AdvancedMarkerElement>
  > = [];

  /*
  * =========================
  * NODE FILTER STATE
  * =========================
  */
  let activeNodeTypeFilter:NetworkMapNodeTypeFilter="ALL";
  let activeNodeStatusFilter:NetworkMapNodeStatusFilter="ALL";

  function isNodeVisible(
    nodeType:string|undefined,
    status:string|undefined,
  ){
    const typeVisible=
      activeNodeTypeFilter==="ALL"||
      nodeType===activeNodeTypeFilter;

    const statusVisible=
      activeNodeStatusFilter==="ALL"||
      status===activeNodeStatusFilter;

    return typeVisible&&statusVisible;
  }

  /*
  * =========================
  * APPLY NODE FILTERS
  * =========================
  */
  function applyNodeFilters(){
    nodes.forEach((node,index)=>{
      const marker=nodeMarkers[index];
      if(!marker) return;

      marker.map=
        isNodeVisible(
          node.nodeType,
          node.status,
        )
          ?map
          :null;
    });

    /*
    * Selected node ikut ditutup bila
    * tidak lagi terlihat.
    */
    if(
      selectedNodeInternal&&
      !isNodeVisible(
        selectedNodeInternal.nodeType,
        selectedNodeInternal.status,
      )
    ){
      selectedNodeInternal.element.style.background="#2563eb";
      selectedNodeInternal=null;
      closeNodeInfoContent();
      nodeInfoWindow.close();
    }

    /*
    * Jalur mengikuti visibility endpoint.
    */
    applyLinkFilters();
  }

  /*
  * =========================
  * LINK FILTER VISIBILITY
  * =========================
  * Link hanya tampil jika source dan target
  * sama-sama terlihat oleh filter node.
  */
  function isLinkVisible(link:TemporaryLink){
    return (
      isNodeVisible(
        link.sourceNode.nodeType,
        link.sourceNode.status,
      )&&
      isNodeVisible(
        link.targetNode.nodeType,
        link.targetNode.status,
      )
    );
  }

  /*
  * =========================
  * APPLY LINK FILTERS
  * =========================
  */
  function applyLinkFilters(){
    /*
    * Jika route selected menjadi tersembunyi,
    * tutup InfoWindow dan waypoint marker.
    */
    if(
      selectedLinkInternal&&
      !isLinkVisible(selectedLinkInternal)
    ){
      clearRouteSelection();
    }

    for(const link of links){
      link.polyline.setMap(
        isLinkVisible(link)?map:null,
      );
    }
  }

  /*
  * =========================
  * GOOGLE MAP RUNTIME TYPES
  * =========================
  * Shared type diselesaikan dengan
  * implementation Google Maps di engine.
  */
  type TemporaryLink = RuntimeTemporaryLink<
    InstanceType<typeof Polyline>
  >;

  /*
  * =========================
  * TEMPORARY LINK REGISTRY
  * =========================
  * Menyimpan seluruh link temporary
  * yang aktif selama map masih hidup.
  */
  const links: TemporaryLink[] = [];

  /*
 * =========================
 * WAYPOINT MARKER RUNTIME TYPE
 * =========================
 * Runtime type diselesaikan dengan
 * AdvancedMarkerElement milik Google Maps.
 */
  type SelectedWaypointMarker = RuntimeSelectedWaypointMarker<
    InstanceType<typeof AdvancedMarkerElement>
  >;

  /*
  * =========================
  * SELECTED WAYPOINT MARKERS
  * =========================
  * Hanya menyimpan marker waypoint dari
  * route yang sedang selected.
  */
  const selectedWaypointMarkers: SelectedWaypointMarker[] = [];

  /*
 * =========================
 * TOOL MODE STATE
 * =========================
 * Menyimpan mode internal engine.
 */
  let currentMode: ToolMode = "NORMAL";

  /*
  * =========================
  * DRAFT POLYLINE
  * =========================
  * Garis sementara ketika user sedang
  * membuat jalur dan mengikuti cursor.
  */
  const draftPolyline = new Polyline({
    strokeColor: "#2563eb",
    strokeOpacity: 0.9,
    strokeWeight: 4,
    clickable: false,
    zIndex: 100,
  });

  /*
  * =========================
  * DRAFT POLYLINE CLEANUP
  * =========================
  */
  cleanups.push(() => {
    draftPolyline.setMap(null);
  });

  /*
  * =========================
  * SET TOOL MODE
  * =========================
  * Sinkronkan mode internal engine, React UI,
  * draggable node, dan cursor Google Map.
  */
  function setMode(nextMode: ToolMode) {
    currentMode = nextMode;
    callbacks.setToolMode(nextMode);

    /* Node hanya draggable pada mode NORMAL. */
    for (const marker of nodeMarkers) {
      marker.gmpDraggable = nextMode === "NORMAL";
    }

    /* Mode editing menggunakan cursor crosshair. */
    const editingMode = nextMode !== "NORMAL";
    container.style.cursor = editingMode ? "crosshair" : "";
    map.setOptions({
      draggableCursor: editingMode ? "crosshair" : null,
    });
  }

  /*
  * =========================
  * CLEAR NODE SELECTION
  * =========================
  * Mengembalikan marker node ke visual normal,
  * menghapus internal selection, lalu menutup
  * Node InfoWindow.
  */
  function clearNodeSelection() {
    if(selectedNodeInternal&&selectedNodeInternal!==sourceNode)
    resetNodeElement(selectedNodeInternal.element);

    selectedNodeInternal=null;
    closeNodeInfoContent();
    nodeInfoWindow.close();
  }

  /*
  * =========================
  * NODE INFO WINDOW CLOSE
  * =========================
  * Tombol X bawaan Google Maps juga harus
  * membersihkan selected node.
  */
  const nodeInfoCloseListener=nodeInfoWindow.addListener("closeclick",()=>{
    if(selectedNodeInternal&&selectedNodeInternal!==sourceNode)
      resetNodeElement(selectedNodeInternal.element);

    selectedNodeInternal=null;
    closeNodeInfoContent();
  });

  /*
  * =========================
  * NODE INFO CLOSE CLEANUP
  * =========================
  */
  cleanups.push(() => {
    nodeInfoCloseListener.remove();
  });

  /*
  * =========================
  * RESET WAYPOINT VISUAL
  * =========================
  * Mengembalikan semua marker waypoint
  * ke style normal tanpa menghapus marker.
  */
  function resetWaypointSelectionStyle() {
    for (const item of selectedWaypointMarkers) {
      const content = item.marker.content;
      if (!(content instanceof HTMLElement)) continue;
      content.style.background = "#ffffff";
      content.style.color = "#f59e0b";
    }
  }

  /*
  * =========================
  * CLEAR WAYPOINT MARKERS
  * =========================
  * Menghapus seluruh waypoint marker
  * dari route yang sedang selected.
  */
  function clearWaypointMarkers() {
    for (const item of selectedWaypointMarkers) item.remove();
    selectedWaypointMarkers.length = 0;
  }

  /*
  * =========================
  * CLOSE WAYPOINT INFO ONLY
  * =========================
  * Menutup InfoWindow waypoint tanpa
  * membatalkan selected route.
  */
  function closeWaypointInfoOnly() {
    closeWaypointInfoContent();
    waypointInfoWindow.close();
    resetWaypointSelectionStyle();
    callbacks.setSelectedWaypoint(null);
  }

  /*
  * =========================
  * CLOSE ROUTE INFO ONLY
  * =========================
  * Menutup Route InfoWindow tanpa
  * menghapus route selection.
  */
  function closeRouteInfoOnly() {
    closeRouteInfoContent();
    routeInfoWindow.close();
    routeInfoPosition = null;
  }
  
  /*
  * =========================
  * CLEAR ROUTE SELECTION
  * =========================
  * Membatalkan seluruh route selection:
  * - route kembali ke style normal
  * - waypoint InfoWindow ditutup
  * - route InfoWindow ditutup
  * - waypoint markers dihapus
  * - React route state dibersihkan
  */
  function clearRouteSelection() {
    if (selectedLinkInternal) {
      selectedLinkInternal.polyline.setOptions({
        strokeColor: "#2563eb",
        strokeOpacity: 1,
        strokeWeight: 5,
        zIndex: 50,
      });
    }

    closeWaypointInfoOnly();
    closeRouteInfoOnly();
    clearWaypointMarkers();

    selectedLinkInternal = null;
    callbacks.setCompletedRoute(null);
  }

  /*
  * =========================
  * EXPOSE CLEAR ROUTE ACTION
  * =========================
  */
  actions.clearRouteSelection = clearRouteSelection;

  /*
  * =========================
  * ROUTE INFO WINDOW CLOSE
  * =========================
  * Tombol X bawaan Google InfoWindow
  * membatalkan route selection sepenuhnya.
  */
  const routeInfoCloseListener = routeInfoWindow.addListener(
    "closeclick",
    () => {
      closeRouteInfoContent();
      routeInfoPosition = null;
    },
  );
  /*
  * =========================
  * ROUTE INFO CLOSE CLEANUP
  * =========================
  */
  cleanups.push(() => {
    routeInfoCloseListener.remove();
  });

  /*
  * =========================
  * SELECT NODE
  * =========================
  * Memilih node, menutup route selection,
  * memberi highlight marker, dan membuka
  * Node InfoWindow pada marker terkait.
  */
  function selectNode(
    node: TemporaryNode,
    marker: InstanceType<typeof AdvancedMarkerElement>,
    panToNode = true,
  ) {
    /* Route/waypoint selection harus ditutup. */
    clearRouteSelection();
    // menuju lokasi
    if (panToNode) map.panTo(node.position);
    /* Reset visual node sebelumnya. */
    if(
      selectedNodeInternal&&
      selectedNodeInternal.id!==node.id&&
      selectedNodeInternal!==sourceNode
    ){
      resetNodeElement(selectedNodeInternal.element);
    }

    selectedNodeInternal=node;
    selectNodeElement(node.element);

    /* Bersihkan content InfoWindow lama. */
    closeNodeInfoContent();

    const content = createNodeInfoWindowContent({
      node,
       onDetailRequest:callbacks.requestNodeDetail,
       onDeleteRequest: callbacks.requestDeleteNode,
       onEditRequest: callbacks.requestEditNode,
    });

    nodeInfoContentCleanup = content.cleanup;
    nodeInfoWindow.setHeaderContent(content.header);
    nodeInfoWindow.setContent(content.element);

    /*
    * AdvancedMarkerElement dipakai sebagai anchor
    * supaya posisi InfoWindow tepat di atas marker.
    */
    nodeInfoWindow.open({
      anchor: marker,
      map,
      shouldFocus: false,
    });

    /* Bersihkan UI lain yang tidak relevan. */
    callbacks.setSelectedCoordinate(null);
    callbacks.setSelectedPointLabel(null);
    callbacks.setCompletedRoute(null);
  }

  /*
  * =========================
  * OPEN ROUTE INFO WINDOW
  * =========================
  * Membuka informasi route pada posisi
  * tertentu di atas polyline.
  *
  * Route tidak memiliki marker anchor,
  * sehingga memakai setPosition().
  */
  function openRouteInfoWindow(
    link: TemporaryLink,
    position: Coordinate,
  ) {
    /* Bersihkan DOM content sebelumnya. */
    closeRouteInfoContent();

    const content = createRouteInfoWindowContent({
      linkId: link.id,
      sourceCode: link.sourceNode.code,
      targetCode: link.targetNode.code,
      lengthMeters: link.routeInfo.lengthMeters,
      waypointCount: link.waypoints.length,

      /*
      * Action Add Waypoint nantinya dipasang
      * ke actions.startAddWaypoint.
      *
      * Dengan cara ini function ini tidak perlu
      * bergantung langsung pada startAddWaypoint()
      * yang belum kita pindahkan.
      */
      onAddWaypoint: () => {
        routeInfoWindow.close();
        actions.startAddWaypoint?.();
      },
      onEditRequest: callbacks.requestEditLink,
      /*
      * Delete tidak dilakukan langsung.
      * React akan membuka AlertDialog shadcn.
      */
      onDeleteRequest: callbacks.requestDeleteLink,
      onManageFiberCores:callbacks.requestManageFiberCores,
    });

    routeInfoPosition = position;
    routeInfoContentCleanup = content.cleanup;

    routeInfoWindow.setHeaderContent(content.header);
    routeInfoWindow.setContent(content.element);
    routeInfoWindow.setPosition(position);
    routeInfoWindow.open({
      map,
      shouldFocus: false,
    });
  }

  /*
  * =========================
  * BUILD LINK PATH
  * =========================
  * Endpoint selalu membaca posisi node terbaru,
  * sedangkan waypoint berasal dari route memory.
  */
  function buildLinkPath(link: TemporaryLink): Coordinate[] {
    return [
      link.sourceNode.position,
      ...link.waypoints,
      link.targetNode.position,
    ];
  }

  /*
  * =========================
  * UPDATE TEMPORARY LINK
  * =========================
  * Dipakai setelah node endpoint atau waypoint
  * berubah posisi.
  */
  function updateTemporaryLink(
    link: TemporaryLink,
    persistedLengthMeters?: number,
  ) {
    const path = buildLinkPath(link);

    link.polyline.setPath(path);

    link.routeInfo.lengthMeters =
      persistedLengthMeters ??
      calculateRouteLength(path);

    link.routeInfo.pointCount =
      path.length;

    link.routeInfo.waypointCount =
      link.waypoints.length;

    callbacks.setCompletedRoute(
      (current) => {
        if (
          current?.linkId !== link.id
        ) {
          return current;
        }

        return {
          ...link.routeInfo,
        };
      },
    );

    if (
      selectedLinkInternal?.id ===
        link.id &&
      routeInfoPosition
    ) {
      const midpoint =
        getRouteMidpoint(path);

      if (midpoint) {
        openRouteInfoWindow(
          link,
          midpoint,
        );
      }
    }
  }

  /*
  * =========================
  * UPDATE CONNECTED LINKS
  * =========================
  * Dipanggil setelah posisi node berubah.
  * Semua link yang source/target-nya memakai
  * node tersebut akan dihitung ulang.
  */
  function updateConnectedLinks(node: TemporaryNode) {
    for (const link of links) {
      const connected =
        link.sourceNode.id === node.id ||
        link.targetNode.id === node.id;

      if (!connected) continue;
      updateTemporaryLink(link);
    }
  }

  /*
  * =========================
  * OPEN WAYPOINT INFO WINDOW
  * =========================
  * Membuka InfoWindow pada waypoint marker.
  * Route tetap selected, tetapi Route InfoWindow
  * ditutup agar tidak tampil bersamaan.
  */
  function openWaypointInfoWindow(
    link: TemporaryLink,
    index: number,
    marker: InstanceType<typeof AdvancedMarkerElement>,
  ) {
    const position = link.waypoints[index];
    if (!position) return;

    /*
    * Node tidak boleh selected bersamaan.
    * Route selection tetap dipertahankan.
    */
    clearNodeSelection();
    closeRouteInfoOnly();
    closeWaypointInfoContent();

    const content = createWaypointInfoWindowContent({
      linkId: link.id,
      index,
      position,
      onDeleteRequest: callbacks.requestDeleteWaypoint,
    });

    waypointInfoContentCleanup = content.cleanup;
    waypointInfoWindow.setHeaderContent(content.header);
    waypointInfoWindow.setContent(content.element);
    waypointInfoWindow.open({
      anchor: marker,
      map,
      shouldFocus: false,
    });

    callbacks.setSelectedWaypoint({
      linkId: link.id,
      index,
      position: { ...position },
    });
  }

  /*
  * =========================
  * WAYPOINT INFO WINDOW CLOSE
  * =========================
  * Menutup waypoint selection saja.
  * Route tetap selected dan waypoint markers
  * tetap berada di map.
  */
  const waypointInfoCloseListener = waypointInfoWindow.addListener(
    "closeclick",
    () => {
      closeWaypointInfoContent();
      resetWaypointSelectionStyle();
      callbacks.setSelectedWaypoint(null);
    },
  );

  /*
  * =========================
  * WAYPOINT INFO CLOSE CLEANUP
  * =========================
  */
  cleanups.push(() => {
    waypointInfoCloseListener.remove();
  });

  /*
  * =========================
  * RENDER WAYPOINT MARKERS
  * =========================
  * Hanya waypoint dari route selected
  * yang ditampilkan pada map.
  */
  function renderWaypointMarkers(link: TemporaryLink) {
    /*
    * Marker lama dan InfoWindow waypoint
    * harus dibersihkan sebelum render ulang.
    */
    closeWaypointInfoOnly();
    clearWaypointMarkers();

    link.waypoints.forEach((waypoint, index) => {
      /* =========================
      * CREATE WAYPOINT ELEMENT
      * ========================= */
      const element = createWaypointElement(index);

      /* =========================
      * CREATE WAYPOINT MARKER
      * ========================= */
      const marker = new AdvancedMarkerElement({
        map,
        position: waypoint,
        title: `Waypoint ${index + 1}`,
        content: element,
        gmpDraggable: true,
        gmpClickable: true,
      });

      let positionBeforeDrag: Coordinate | null = null;

      /* =========================
      * WAYPOINT CLICK
      * ========================= */
      const clickListener = marker.addListener("click", () => {
        resetWaypointSelectionStyle();
        element.style.background = "#f59e0b";
        element.style.color = "#ffffff";
        openWaypointInfoWindow(link, index, marker);
      });

      /* =========================
      * WAYPOINT DRAG START
      * =========================
      * Route InfoWindow ditutup sementara
      * selama geometry sedang berubah.
      */
      const dragStartListener =
        marker.addListener(
          "dragstart",
          () => {
            positionBeforeDrag = {
              ...link.waypoints[index],
            };
            closeRouteInfoOnly();
            element.style.background ="#f59e0b";
            element.style.color ="#ffffff";
            element.style.transform ="scale(1.15)";
          },
        );

      /* =========================
      * WAYPOINT LIVE DRAG
      * =========================
      * Update memory + polyline realtime.
      * React tidak dirender pada setiap pixel.
      */
      const dragListener = marker.addListener("drag", (event:any) => {
        if (!event.latLng) return;

        const newPosition: Coordinate = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };

        link.waypoints[index] = newPosition;
        link.polyline.setPath(buildLinkPath(link));
      });

      /* =========================
      * WAYPOINT DRAG END
      * ========================= */
      const dragEndListener =
      marker.addListener(
        "dragend",
        async (event: any) => {
          const previousPosition =
            positionBeforeDrag
              ? { ...positionBeforeDrag }
              : { ...link.waypoints[index] };

          positionBeforeDrag = null;

          if (event.latLng) {
            link.waypoints[index] = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };
          }

          callbacks.setInstruction(
            "Menyimpan posisi waypoint...",
          );

          const result =
            await callbacks.persistLinkWaypoints({
              linkId: link.id,
              waypoints:
                link.waypoints.map(
                  (item) => ({
                    ...item,
                  }),
                ),
            });

          /*
          * =========================
          * ROLLBACK
          * =========================
          */
          if (!result.success) {
            link.waypoints[index] =
              previousPosition;

            marker.position =
              previousPosition;

            updateTemporaryLink(link);

            callbacks.setInstruction(
              `Gagal memindahkan waypoint: ${result.message}`,
            );

            element.style.transform = "";

            openWaypointInfoWindow(
              link,
              index,
              marker,
            );

            return;
          }

          /*
          * DB berhasil → runtime mengikuti
          * koordinat hasil database.
          */
          link.waypoints =
            result.waypoints.map(
              (item) => ({
                ...item,
              }),
            );

          const persistedPosition =
            link.waypoints[index];

          if (persistedPosition) {
            marker.position =
              persistedPosition;
          }

          updateTemporaryLink(
            link,
            result.routeLengthMeters,
          );

          element.style.background =
            "#f59e0b";
          element.style.color =
            "#ffffff";
          element.style.transform = "";

          callbacks.setInstruction(null);

          openWaypointInfoWindow(
            link,
            index,
            marker,
          );
        },
      );

      /* =========================
      * WAYPOINT MARKER CLEANUP
      * ========================= */
      let removed = false;

      const remove = () => {
        if (removed) return;
        removed = true;

        clickListener.remove();
        dragStartListener.remove();
        dragListener.remove();
        dragEndListener.remove();
        marker.map = null;
      };

      /*
      * Registry dipakai oleh:
      * - resetWaypointSelectionStyle()
      * - clearWaypointMarkers()
      */
      selectedWaypointMarkers.push({
        marker,
        remove,
      });
    });
  }

  /*
  * =========================
  * SELECT ROUTE
  * =========================
  * Memilih satu temporary link:
  * - tutup selection node
  * - tutup waypoint InfoWindow
  * - reset route sebelumnya
  * - highlight route baru
  * - tampilkan waypoint markers
  * - buka Route InfoWindow
  */
  function selectRoute(
    link: TemporaryLink,
    infoPosition?: Coordinate,
  ) {
    /* Node tidak boleh selected bersamaan. */
    clearNodeSelection();

    /* Waypoint popup lama ditutup, route tetap bisa dipilih. */
    closeWaypointInfoOnly();

    /* =========================
    * RESET PREVIOUS ROUTE
    * ========================= */
    if (
      selectedLinkInternal &&
      selectedLinkInternal.id !== link.id
    ) {
      selectedLinkInternal.polyline.setOptions({
        strokeColor: "#2563eb",
        strokeOpacity: 1,
        strokeWeight: 5,
        zIndex: 50,
      });
    }

    /* =========================
    * SET SELECTED ROUTE
    * ========================= */
    selectedLinkInternal = link;

    link.polyline.setOptions({
      strokeColor: "#f59e0b",
      strokeOpacity: 1,
      strokeWeight: 7,
      zIndex: 80,
    });

    /* =========================
    * SHOW WAYPOINT MARKERS
    * ========================= */
    renderWaypointMarkers(link);

    /* =========================
    * UPDATE REACT UI STATE
    * ========================= */
    callbacks.setSelectedCoordinate(null);
    callbacks.setSelectedPointLabel(null);
    callbacks.setCompletedRoute({ ...link.routeInfo });

    /* =========================
    * INFO WINDOW POSITION
    * =========================
    * Jika route diklik, gunakan posisi klik.
    * Jika route baru selesai dibuat, gunakan midpoint.
    */
    const position =
      infoPosition ??
      getRouteMidpoint(buildLinkPath(link));

    if (position) openRouteInfoWindow(link, position);
  }
  

  /*
  * =========================
  * DELETE WAYPOINT
  * =========================
  */
  async function deleteWaypoint(
    linkId: number,
    waypointIndex: number,
  ) {
    const link =
      findById(links, linkId);

    if (!link) return;

    if (
      waypointIndex < 0 ||
      waypointIndex >=
        link.waypoints.length
    ) {
      return;
    }

    /*
    * Candidate tanpa langsung mutate runtime.
    */
    const nextWaypoints =
      link.waypoints.map(
        (waypoint) => ({
          ...waypoint,
        }),
      );

    nextWaypoints.splice(
      waypointIndex,
      1,
    );

    callbacks.setInstruction(
      "Menghapus waypoint...",
    );

    const result =
      await callbacks.persistLinkWaypoints({
        linkId: link.id,
        waypoints: nextWaypoints,
      });

    if (!result.success) {
      callbacks.setInstruction(
        `Gagal menghapus waypoint: ${result.message}`,
      );
      return;
    }

    /*
    * DB berhasil.
    */
    link.waypoints =
      result.waypoints.map(
        (waypoint) => ({
          ...waypoint,
        }),
      );

    closeWaypointInfoContent();
    waypointInfoWindow.close();
    callbacks.setSelectedWaypoint(null);

    updateTemporaryLink(
      link,
      result.routeLengthMeters,
    );

    if (
      selectedLinkInternal?.id ===
      link.id
    ) {
      renderWaypointMarkers(link);

      const position =
        getRouteMidpoint(
          buildLinkPath(link),
        );

      if (position) {
        openRouteInfoWindow(
          link,
          position,
        );
      }
    }

    callbacks.setInstruction(null);
  }

  /*
  * =========================
  * EXPOSE DELETE WAYPOINT
  * =========================
  * Dipanggil React setelah user mengonfirmasi
  * AlertDialog shadcn.
  */
  actions.deleteWaypoint = deleteWaypoint;

  /*
  * =========================
  * INSERT WAYPOINT
  * =========================
  * Menambahkan waypoint baru ke segment route
  * yang paling dekat dengan posisi klik.
  */
  async function insertWaypoint(
    link: TemporaryLink,
    coordinate: Coordinate,
  ) {
    const path =
      buildLinkPath(link);

    const segmentIndex =
      findNearestSegmentIndex(
        path,
        coordinate,
      );

    /*
    * Buat candidate baru tanpa langsung
    * mengubah runtime.
    */
    const nextWaypoints =
      link.waypoints.map(
        (waypoint) => ({
          ...waypoint,
        }),
      );

    nextWaypoints.splice(
      segmentIndex,
      0,
      { ...coordinate },
    );

    /*
    * Stop ADD_WAYPOINT agar klik kedua
    * tidak membuat request ganda.
    */
    setMode("NORMAL");

    callbacks.setInstruction(
      "Menyimpan waypoint...",
    );

    const result =
      await callbacks.persistLinkWaypoints({
        linkId: link.id,
        waypoints: nextWaypoints,
      });

    if (!result.success) {
      callbacks.setInstruction(
        `Gagal menambah waypoint: ${result.message}`,
      );

      const midpoint =
        getRouteMidpoint(
          buildLinkPath(link),
        );

      if (midpoint) {
        openRouteInfoWindow(
          link,
          midpoint,
        );
      }

      return;
    }

    /*
    * DB berhasil → runtime mengikuti DB.
    */
    link.waypoints =
      result.waypoints.map(
        (waypoint) => ({
          ...waypoint,
        }),
      );

    updateTemporaryLink(
      link,
      result.routeLengthMeters,
    );

    renderWaypointMarkers(link);

    callbacks.setInstruction(null);

    const persistedPosition =
      link.waypoints[segmentIndex] ??
      coordinate;

    openRouteInfoWindow(
      link,
      persistedPosition,
    );
  }

  /*
  * =========================
  * COORDINATE MARKER RUNTIME
  * =========================
  */
  let coordinateMarker: InstanceType<typeof AdvancedMarkerElement> | null = null;
  let coordinateMarkerClickListener: google.maps.MapsEventListener | null = null;
  const coordinateInfoWindow = new InfoWindow();

  cleanups.push(() => {
    coordinateMarkerClickListener?.remove();
    coordinateMarkerClickListener = null;

    coordinateInfoWindow.close();

    if (coordinateMarker) {
      coordinateMarker.map = null;
      coordinateMarker = null;
    }
  });

  /*
  * =========================
  * DELETE TEMPORARY LINK
  * =========================
  * Menghapus satu link tanpa menghapus
  * source node maupun target node.
  */
  function deleteTemporaryLink(linkId: number) {
    /* =========================
    * FIND LINK
    * ========================= */
    const link = findById(links, linkId);
    if (!link) return;

    /* =========================
    * CLEAR SELECTED LINK
    * =========================
    * Jika link yang dihapus sedang selected,
    * bersihkan waypoint dan InfoWindow miliknya.
    */
    if (selectedLinkInternal?.id === link.id) {
      closeWaypointInfoOnly();
      clearWaypointMarkers();
      closeRouteInfoOnly();
      selectedLinkInternal = null;
    }

    /* =========================
    * REMOVE POLYLINE
    * =========================
    * remove() membersihkan polyline dan
    * listener Google Maps milik link.
    */
    link.remove();

    /* =========================
    * REMOVE FROM REGISTRY
    * ========================= */
    removeById(links, link.id);

    /* =========================
    * CLEAR REACT STATE
    * ========================= */
    callbacks.setCompletedRoute((current) => {
      if (current?.linkId !== link.id) return current;
      return null;
    });

    callbacks.setSelectedWaypoint((current) => {
      if (current?.linkId !== link.id) return current;
      return null;
    });

    callbacks.setInstruction(null);
  }

  /*
  * =========================
  * EXPOSE DELETE LINK
  * =========================
  * Dipanggil setelah user mengonfirmasi
  * AlertDialog shadcn di React component.
  */
  actions.deleteSelectedLink = deleteTemporaryLink;

  //  NODE SECTION 
  /*
  * =========================
  * DELETE TEMPORARY NODE
  * =========================
  * Menghapus satu node beserta seluruh link
  * yang terhubung. Node lain tidak ikut dihapus.
  */
  function deleteTemporaryNode(nodeId: number) {
    /* =========================
    * FIND NODE
    * ========================= */
    const nodeToDelete = findById(nodes, nodeId);
    if (!nodeToDelete) return;

    /*
    * =========================
    * REMOVE CONNECTED LINKS
    * =========================
    * Loop dari belakang karena array links
    * di-splice selama proses delete.
    */
    const removedLinkIds = new Set<number>();

    for (let index = links.length - 1; index >= 0; index--) {
      const link = links[index];
      const connected =
        link.sourceNode.id === nodeToDelete.id ||
        link.targetNode.id === nodeToDelete.id;

      if (!connected) continue;

      removedLinkIds.add(link.id);

      /*
      * Jika connected link sedang selected,
      * tutup seluruh UI selection miliknya.
      */
      if (selectedLinkInternal?.id === link.id) {
        closeWaypointInfoOnly();
        clearWaypointMarkers();
        closeRouteInfoOnly();
        selectedLinkInternal = null;
      }

      link.remove();
      links.splice(index, 1);
    }

    /*
    * =========================
    * CLEAR REMOVED LINK STATE
    * =========================
    */
    callbacks.setCompletedRoute((current) => {
      if (!current || !removedLinkIds.has(current.linkId)) return current;
      return null;
    });

    callbacks.setSelectedWaypoint((current) => {
      if (!current || !removedLinkIds.has(current.linkId)) return current;
      return null;
    });

    /*
    * =========================
    * CLEAR NODE SELECTION
    * =========================
    */
    if (selectedNodeInternal?.id === nodeToDelete.id) {
      selectedNodeInternal = null;
      closeNodeInfoContent();
      nodeInfoWindow.close();
    }

    /*
    * =========================
    * SOURCE DRAW SAFEGUARD
    * =========================
    * Secara normal delete hanya terjadi pada
    * mode NORMAL, tetapi state source tetap
    * dibersihkan sebagai proteksi tambahan.
    */
    if (sourceNode?.id === nodeToDelete.id) {
      sourceNode = null;
      drawingPoints = [];
      pointerPosition = null;
      draftPolyline.setMap(null);
      callbacks.setWaypointCount(0);
    }

    /* =========================
    * REMOVE NODE MARKER
    * ========================= */
    nodeToDelete.remove();

    /* =========================
    * REMOVE NODE REGISTRY
    * ========================= */
    removeById(nodes, nodeToDelete.id);
    callbacks.setNodeCount(nodes.length);

    /* =========================
    * CLEAR UI STATE
    * ========================= */
    callbacks.setSelectedCoordinate(null);
    callbacks.setSelectedPointLabel(null);
    callbacks.setInstruction(null);
  }

  /*
  * =========================
  * EXPOSE DELETE NODE
  * =========================
  * Dipanggil React setelah user mengonfirmasi
  * AlertDialog shadcn.
  */
  actions.deleteSelectedNode = deleteTemporaryNode;

  /*
  * =========================
  * CREATE TEMPORARY NODE
  * =========================
  * Tahap 18A hanya menangani:
  * - data node
  * - visual marker
  * - registry
  * - cleanup
  *
  * Click/drag listener dipasang pada 18B.
  */
  type CreateRuntimeNodeInput = {
    id: number;
    code: string;
    name?: string;
    nodeType: string;
    status?: string;
    position: Coordinate;
    notifyCount?: boolean;
    address?: string | null;
    description?: string | null;
    portSummary:NetworkMapPortSummary;
    customerInfo?:NetworkMapCustomerInfo|null;
  };

  /*
  * =========================
  * CREATE RUNTIME NODE
  * =========================
  * Satu factory digunakan baik untuk node DB
  * maupun temporary node sebelum tahap Create DB.
  */
  function createRuntimeNode({
    id,
    code,
    name,
    nodeType,
    status,
    position,
    notifyCount=true,
    address,
    description,
    customerInfo=null,
    portSummary,
  }: CreateRuntimeNodeInput) {
    const element = createNodeElement(nodeType, code);

    const node: TemporaryNode = {
      id,
      code,
      name,
      nodeType,
      status,
      address:address??null,
      description:description??null,
      position:{...position},
      element,
      portSummary,
      customerInfo,
      remove: () => {},
    };

    const marker = new AdvancedMarkerElement({
      map:isNodeVisible(nodeType, status) ?map:null,
      position,
      content: element,
      title: name || code,
      gmpClickable: true,
      gmpDraggable: currentMode === "NORMAL",
      anchorLeft: "-50%",
      anchorTop: "-50%",
    });

    /*
    * =========================
    * NODE TAP / CLICK
    * =========================
    * Mobile:
    * - tap pendek = buka InfoWindow
    * - pointer bergerak = drag, jangan buka InfoWindow
    *
    * Desktop:
    * - tetap gunakan gmp-click
    */
    let isNodeDragging=false;
    let touchStart:{
      pointerId:number;
      x:number;
      y:number;
    }|null=null;
    let suppressClickUntil=0;

    const handleMarkerClick=()=>{
      if(isNodeDragging)return;
      if(Date.now()<suppressClickUntil)return;
      handleNodeClick(node,marker);
    };

    const handleTouchStart=(event:PointerEvent)=>{
      if(event.pointerType!=="touch")return;

      touchStart={
        pointerId:event.pointerId,
        x:event.clientX,
        y:event.clientY,
      };
    };

    const handleTouchEnd=(event:PointerEvent)=>{
      if(
        event.pointerType!=="touch"||
        !touchStart||
        touchStart.pointerId!==event.pointerId
      )return;

      const distance=Math.hypot(
        event.clientX-touchStart.x,
        event.clientY-touchStart.y,
      );

      touchStart=null;

      /*
      * Gerakan lebih dari 10px dianggap drag.
      */
      if(isNodeDragging||distance>10)return;

      /*
      * Cegah gmp-click kedua setelah touch tap.
      */
      suppressClickUntil=Date.now()+500;

      handleNodeClick(node,marker);
    };

    const handleTouchCancel=()=>{
      touchStart=null;
    };

    marker.addEventListener(
      "gmp-click",
      handleMarkerClick,
    );

    element.addEventListener(
      "pointerdown",
      handleTouchStart,
    );

    element.addEventListener(
      "pointerup",
      handleTouchEnd,
    );

    element.addEventListener(
      "pointercancel",
      handleTouchCancel,
    );

    /*
    * =========================
    * NODE DRAG START
    * =========================
    */
   let positionBeforeDrag: Coordinate | null = null;
    const markerDragStart = marker.addListener(
      "dragstart",
      () => {
         isNodeDragging=true;
         touchStart=null;

        if (currentMode !== "NORMAL") return;

        positionBeforeDrag = {
          ...node.position,
        };

        clearRouteSelection();

        if(
          selectedNodeInternal&&
          selectedNodeInternal.id!==node.id&&
          selectedNodeInternal!==sourceNode
        ){
          resetNodeElement(selectedNodeInternal.element);
        }

        selectedNodeInternal=node;
        selectNodeElement(node.element);

        closeNodeInfoContent();
        nodeInfoWindow.close();

        callbacks.setSelectedCoordinate(null);
        callbacks.setSelectedPointLabel(null);
        callbacks.setInstruction(
          `${node.code} sedang dipindahkan.`,
        );
      },
    );

   /*
    * =========================
    * NODE DRAG END
    * =========================
    * UI diperbarui dahulu, kemudian posisi
    * disimpan satu kali ke database.
    *
    * Jika persistence gagal, posisi marker
    * dan connected routes dikembalikan.
    */
    const markerDragEnd = marker.addListener(
      "dragend",
      async (event:any) => {
        suppressClickUntil=Date.now()+500;
        isNodeDragging=false;
        touchStart=null;
        
        if (
          currentMode !== "NORMAL" ||
          !event.latLng
        ) {
          positionBeforeDrag = null;
          return;
        }

        const previousPosition = positionBeforeDrag ?? { ...node.position };

        const nextPosition: Coordinate = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };

        positionBeforeDrag = null;

        /* Update runtime immediately. */
        node.position = nextPosition;
        updateConnectedLinks(node);

        callbacks.setInstruction(
          `Menyimpan posisi ${node.code}...`,
        );

        const result =
          await callbacks.persistNodePosition({
            id: node.id,
            position: nextPosition,
          });

        /*
        * =========================
        * ROLLBACK ON FAILURE
        * =========================
        */
        if (!result.success) {
          node.position = previousPosition;
          marker.position = previousPosition;

          updateConnectedLinks(node);

          callbacks.setInstruction(
            `Gagal memindahkan ${node.code}: ${result.message}`,
          );

          return;
        }

        /*
        * Gunakan posisi hasil database sebagai
        * final source of truth.
        */
        node.position = {
          ...result.position,
        };

        marker.position = result.position;

        updateConnectedLinks(node);
        callbacks.setInstruction(null);
      },
    );

    const removeListeners = () => {
      marker.removeEventListener("gmp-click",handleMarkerClick);
      markerDragStart.remove();
      markerDragEnd.remove();
    };

    let removed = false;

    node.remove = () => {
      if (removed) return;
      removed = true;

      removeListeners();
      marker.map = null;

      const markerIndex = nodeMarkers.indexOf(marker);
      if (markerIndex >= 0) nodeMarkers.splice(markerIndex, 1);
    };

    nodes.push(node);
    nodeMarkers.push(marker);

    if (notifyCount) callbacks.setNodeCount(nodes.length);

    cleanups.push(() => {
      node.remove();
    });

    return {
      node,
      marker,
    };
  }

  /*
  * =========================
  * ADD PERSISTED NODE
  * =========================
  * Dipanggil setelah Server Action berhasil.
  * ID/code seluruhnya berasal dari PostgreSQL.
  */
  function addPersistedNode(item: NetworkMapNodeDto) {
    /*
    * Guard agar node yang sama tidak dimasukkan
    * dua kali ke runtime registry.
    */
    const exists = nodes.some(
      (node) =>
        node.id === item.id ||
        node.code.toLowerCase() === item.code.toLowerCase(),
    );

    if (exists) return;

    const created = createRuntimeNode({
      id: item.id,
      code: item.code,
      name: item.name,
      nodeType: item.nodeType,
      status: item.status,
      portSummary: item.portSummary,
      position: {
        lat: item.position.lat,
        lng: item.position.lng,
      },
    });

    /*
    * Node baru langsung selected dan InfoWindow
    * tampil, tetapi map tidak melakukan pan.
    */
    selectNode(
      created.node,
      created.marker,
      false,
    );
  }

  actions.addPersistedNode = addPersistedNode;

  /*
  * =========================
  * UPDATE PERSISTED NODE
  * =========================
  */
  function updatePersistedNode(item: NetworkMapNodeDto) {
    const index = nodes.findIndex(
      (node) => node.id === item.id,
    );

    if (index < 0) return;

    const node = nodes[index];
    const marker = nodeMarkers[index];

    if (!node || !marker) return;

    /*
    * Update runtime node.
    * Link menggunakan reference sourceNode/targetNode,
    * jadi perubahan node otomatis ikut terbaca link.
    */
    node.code = item.code;
    node.name = item.name;
    node.nodeType = item.nodeType;
    node.status = item.status;
    node.address = item.address;
    node.description = item.description;
    node.position = {
      lat: item.position.lat,
      lng: item.position.lng,
    };

    /*
    * Update marker.
    */
    node.element.textContent = item.code;
    marker.position = node.position;
    marker.title = item.name || item.code;

    /*
    * Recalculate connected route.
    */
    updateConnectedLinks(node);

    applyNodeFilters();
    /*
    * Jika node sedang dipilih,
    * refresh InfoWindow tanpa pan map.
    */
    if (selectedNodeInternal?.id === node.id) {
      selectNode(
        node,
        marker,
        false,
      );
    }
  }

  actions.updatePersistedNode =updatePersistedNode;

  /*
  * =========================
  * UPDATE NODE PORT SUMMARY
  * =========================
  */
  actions.updateNodePortSummary=(nodeId,portSummary)=>{
    const index=nodes.findIndex((node)=>node.id===nodeId);
    if(index<0) return;

    const node=nodes[index];
    const marker=nodeMarkers[index];
    if(!node||!marker) return;

    node.portSummary={...portSummary};

    /*
    * Jika InfoWindow node sedang terbuka,
    * render ulang tanpa pan map.
    */
    if(selectedNodeInternal?.id===node.id){
      selectNode(node,marker,false);
    }
  };
  
  /*
 * =========================
 * HYDRATE DATABASE NODES
 * =========================
 */
  function hydrateInitialNodes() {
    for (const item of initialNodes) {
      createRuntimeNode({
        id: item.id,
        code: item.code,
        name: item.name,
        nodeType: item.nodeType,
        status: item.status,
        portSummary: item.portSummary,
        position: {
          lat: item.position.lat,
          lng: item.position.lng,
        },
        notifyCount: false,
      });
    }

    callbacks.setNodeCount(nodes.length);
  }

  /*
  * =========================
  * HYDRATE DATABASE LINKS
  * =========================
  * Node wajib sudah di-hydrate lebih dahulu
  * karena link memakai reference source/target.
  */
  function hydrateInitialLinks() {
    for (const item of initialLinks) {
      mountPersistedLink(item);
    }
  }

  /*
  * =========================
  * SEARCH NODES
  * =========================
  * Search langsung dari runtime registry.
  * Mendukung code, name, dan node type.
  */
  function searchNodes(query:string){
    const keyword=query.trim().toLowerCase();
    if(!keyword) return [];

    return nodes
      .filter((node)=>{
        const code=node.code.toLowerCase();
        const name=(node.name??"").toLowerCase();
        const nodeType=(node.nodeType??"").toLowerCase();

        return (
          code.includes(keyword)||
          name.includes(keyword)||
          nodeType.includes(keyword)
        );
      })
      .sort((a,b)=>{
        const aCode=a.code.toLowerCase();
        const bCode=b.code.toLowerCase();
        const aName=(a.name??"").toLowerCase();
        const bName=(b.name??"").toLowerCase();

        /* Exact code paling atas. */
        if(aCode===keyword&&bCode!==keyword) return -1;
        if(bCode===keyword&&aCode!==keyword) return 1;

        /* Code yang diawali keyword berikutnya. */
        const aCodeStart=aCode.startsWith(keyword);
        const bCodeStart=bCode.startsWith(keyword);

        if(aCodeStart&&!bCodeStart) return -1;
        if(bCodeStart&&!aCodeStart) return 1;

        /* Nama yang diawali keyword berikutnya. */
        const aNameStart=aName.startsWith(keyword);
        const bNameStart=bName.startsWith(keyword);

        if(aNameStart&&!bNameStart) return -1;
        if(bNameStart&&!aNameStart) return 1;

        return a.code.localeCompare(b.code);
      })
      .slice(0,10)
      .map((node)=>({
        id:node.id,
        code:node.code,
        position:{...node.position},
      }));
  }

  actions.searchNodes=searchNodes;

  /*
  * =========================
  * FILTER NODE TYPE
  * =========================
  */
  function filterNodeType(
    type:NetworkMapNodeTypeFilter,
  ){
    if(currentMode!=="NORMAL") return;

    activeNodeTypeFilter=type;
    applyNodeFilters();
  }

  actions.filterNodeType=filterNodeType;

  /*
  * =========================
  * FILTER NODE STATUS
  * =========================
  */
  function filterNodeStatus(
    status:NetworkMapNodeStatusFilter,
  ){
    if(currentMode!=="NORMAL") return;

    activeNodeStatusFilter=status;
    applyNodeFilters();
  }

  actions.filterNodeStatus=filterNodeStatus;
  
  /*
  * =========================
  * FOCUS SEARCHED NODE
  * =========================
  * Memusatkan map dan memilih node hasil search.
  */
  function focusNode(nodeId: number) {
    if (currentMode !== "NORMAL") return;

    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index < 0) return;

    const node = nodes[index];
    const marker = nodeMarkers[index];
    if (!node || !marker) return;

    selectNode(node, marker);
  }
  actions.focusNode = focusNode;

  /*
  * =========================
  * CLEAR SOURCE STYLE
  * =========================
  * Mengembalikan marker source ke warna normal.
  */
  function clearSourceStyle() {
    if (!sourceNode) return;
    sourceNode.element.style.background = "#2563eb";
  }

  /*
  * =========================
  * CLEAR DRAWING DRAFT
  * =========================
  * Membersihkan seluruh state sementara drawing:
  * - source marker
  * - waypoint sementara
  * - pointer cursor
  * - draft polyline
  * - waypoint counter
  */
  function clearDraft() {
    clearSourceStyle();
    sourceNode = null;
    drawingPoints = [];
    pointerPosition = null;
    draftPolyline.setMap(null);
    callbacks.setWaypointCount(0);
  }

  /*
  * =========================
  * UPDATE DRAFT LINE
  * =========================
  * Draft path selalu terdiri dari:
  * source + waypoint + posisi cursor terbaru.
  */
  function updateDraftLine() {
    if (
      currentMode !== "DRAW_LINK" ||
      !sourceNode ||
      drawingPoints.length === 0
    ) {
      draftPolyline.setMap(null);
      return;
    }

    const path: Coordinate[] = [...drawingPoints];
    if (pointerPosition) path.push(pointerPosition);

    draftPolyline.setPath(path);
    draftPolyline.setMap(map);
  }

  /*
  * =========================
  * CANCEL CURRENT TOOL
  * =========================
  * Membatalkan mode aktif dan mengembalikan
  * map ke NORMAL tanpa menghapus topology.
  */
  function cancelCurrentTool() {
    const previousMode = currentMode;

    /* Bersihkan draft drawing jika ada. */
    clearDraft();

    /* Kembali ke mode normal. */
    setMode("NORMAL");
    callbacks.setInstruction(null);

    /*
    * Jika user membatalkan ADD_WAYPOINT,
    * route sebelumnya tetap selected dan
    * Route InfoWindow dibuka kembali.
    */
    if (previousMode === "ADD_WAYPOINT" && selectedLinkInternal) {
      const position = getRouteMidpoint(
        buildLinkPath(selectedLinkInternal),
      );

      if (position) {
        openRouteInfoWindow(
          selectedLinkInternal,
          position,
        );
      }
    }
  }
  /*
  * =========================
  * EXPOSE CANCEL TOOL
  * =========================
  */
  actions.cancelTool = cancelCurrentTool;

  /*
  * =========================
  * START ADD NODE
  * =========================
  * Masuk ke mode penambahan node.
  * Node baru dibuat setelah user klik map.
  */
  function startAddNode() {
    /* Bersihkan drawing atau selection sebelumnya. */
    clearDraft();
    clearNodeSelection();
    clearRouteSelection();

    /* Bersihkan detail titik biasa. */
    callbacks.setSelectedCoordinate(null);
    callbacks.setSelectedPointLabel(null);

    /* Aktifkan mode add node. */
    setMode("ADD_NODE");
    callbacks.setInstruction("Klik lokasi pada map untuk menambahkan titik jaringan.");
  }

  /*
  * =========================
  * EXPOSE ADD NODE TOOL
  * =========================
  */
  actions.startAddNode = startAddNode;

  
  /*
  * =========================
  * START DRAWING LINK
  * =========================
  * Mengaktifkan mode pembuatan jalur.
  * Source node belum ditentukan sampai
  * user mengklik node pertama.
  */
  function startDrawing() {
    /* Bersihkan state/tool sebelumnya. */
    clearDraft();
    clearNodeSelection();
    clearRouteSelection();

    /* Bersihkan detail map biasa. */
    callbacks.setSelectedCoordinate(null);
    callbacks.setSelectedPointLabel(null);
    callbacks.setCompletedRoute(null);
    callbacks.setWaypointCount(0);

    /* Aktifkan drawing mode. */
    setMode("DRAW_LINK");
    callbacks.setInstruction("Klik titik jaringan sebagai sumber jalur.");
  }
  /*
  * =========================
  * EXPOSE DRAW LINK TOOL
  * =========================
  */
  actions.startDrawing = startDrawing;


  /*
  * =========================
  * START ADD WAYPOINT
  * =========================
  * Mengaktifkan mode penambahan waypoint
  * pada route yang sedang selected.
  */
  function startAddWaypoint() {
    /* Harus ada route yang sedang selected. */
    if (!selectedLinkInternal) return;

    /*
    * Bersihkan state drawing lama tanpa
    * menghapus selected route.
    */
    clearDraft();
    clearNodeSelection();

    /*
    * InfoWindow ditutup sementara.
    * Route tetap selected/orange dan
    * waypoint markers tetap tampil.
    */
    closeWaypointInfoOnly();
    closeRouteInfoOnly();

    /* Aktifkan mode insert waypoint. */
    setMode("ADD_WAYPOINT");
    callbacks.setInstruction(
      "Klik jalur pada posisi yang ingin ditambahkan waypoint.",
    );
  }
  /*
  * =========================
  * EXPOSE ADD WAYPOINT TOOL
  * =========================
  */
  actions.startAddWaypoint = startAddWaypoint;


  /*
  * =========================
  * UNDO DRAWING WAYPOINT
  * =========================
  * Menghapus waypoint draft terakhir tanpa
  * menghapus source node.
  */
  function undoWaypoint() {
    /* Hanya berlaku saat sedang DRAW_LINK. */
    if (currentMode !== "DRAW_LINK" || !sourceNode) return;

    /*
    * drawingPoints selalu dimulai dari source.
    * Jadi minimal harus ada:
    *
    * [source, waypoint]
    *
    * sebelum waypoint boleh dihapus.
    */
    if (drawingPoints.length <= 1) return;

    /* Hapus waypoint terakhir saja. */
    drawingPoints.pop();

    /*
    * Source tidak dihitung sebagai waypoint.
    */
    callbacks.setWaypointCount(
      Math.max(0, drawingPoints.length - 1),
    );

    /*
    * Render ulang draft menggunakan pointer
    * cursor terakhir sehingga live line tetap
    * mengikuti cursor.
    */
    updateDraftLine();

    callbacks.setInstruction(
      drawingPoints.length > 1
        ? "Klik map untuk menambah waypoint atau klik titik tujuan."
        : "Gerakkan cursor lalu klik map untuk waypoint, atau klik titik tujuan.",
    );
  }
  /*
  * =========================
  * EXPOSE UNDO WAYPOINT
  * =========================
  */
  actions.undoWaypoint = undoWaypoint;

  
  /*
  * =========================
  * MOUNT PERSISTED LINK
  * =========================
  * Satu-satunya jalur untuk memasukkan link
  * yang SUDAH memiliki ID database ke runtime.
  *
  * Dipakai oleh:
  * - hasil Create Fiber Link
  * - hydrate saat refresh
  */
  function mountPersistedLink(persisted: NetworkMapLinkDto,) {
    const exists = links.some((link) => link.id === persisted.id,);

    if (exists) return null;
    const source = nodes.find((node) =>
        node.id === persisted.sourceNodeId,
    );

    const targetNode = nodes.find((node) =>
        node.id === persisted.targetNodeId,
    );

    if (!source || !targetNode) {console.error(
        `Endpoint link ${persisted.id} tidak ditemukan`);
      return null;
    }

    const waypoints = [
      ...persisted.waypoints,
    ]
      .sort(
        (a, b) =>
          a.sequence - b.sequence,
      )
      .map((waypoint) => ({
        lat: waypoint.position.lat,
        lng: waypoint.position.lng,
      }));

    const path: Coordinate[] = [
      { ...source.position },
      ...waypoints,
      { ...targetNode.position },
    ];

    /*
    * =========================
    * CREATE POLYLINE
    * =========================
    */
    const polyline = new Polyline({
      map,
      path,
      strokeColor: "#2563eb",
      strokeOpacity: 1,
      strokeWeight: 5,
      clickable: true,
      zIndex: 50,
    });

    /*
    * Geometry runtime dihitung dari posisi node
    * terbaru + waypoint database.
    */
    const routeInfo = {
      linkId: persisted.id,
      sourceCode: source.code,
      targetCode: targetNode.code,
      waypointCount: waypoints.length,
      pointCount: path.length,
      lengthMeters: calculateRouteLength(path),
    };

    let removed = false;
    let link: TemporaryLink;

    /*
    * =========================
    * POLYLINE CLICK
    * =========================
    */
    const polylineClickListener =
      polyline.addListener(
        "click",
        (event: any) => {
          if (!event.latLng) return;

          const coordinate: Coordinate = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };

          if (currentMode ==="ADD_WAYPOINT") {
            if (selectedLinkInternal?.id !== link.id) {
              return;
            }

            insertWaypoint(
              link,
              coordinate,
            );
            return;
          }

          if (
            currentMode !==
            "NORMAL"
          ) {
            return;
          }

          selectRoute(
            link,
            coordinate,
          );
        },
      );

    /*
    * =========================
    * REMOVE
    * =========================
    */
    const remove = () => {
      if (removed) return;
      removed = true;

      polylineClickListener.remove();
      polyline.setMap(null);
    };

    link = {
      id: persisted.id,
      sourceNode: source,
      targetNode,
      waypoints,
      polyline,
      routeInfo,
      remove,
    };

    links.push(link);

    cleanups.push(() => {
      link.remove();
    });

    return link;
  }

  /*
  * =========================
  * FINISH DRAWING LINK
  * =========================
  * Drawing menghasilkan draft terlebih dahulu.
  * Permanent polyline hanya dibuat setelah
  * Fiber Link berhasil tersimpan di database.
  */
  async function finishLink(targetNode: TemporaryNode) {
    if (currentMode !== "DRAW_LINK" || !sourceNode) return;

    if (targetNode.id === sourceNode.id) {
      callbacks.setInstruction(
        "Titik tujuan harus berbeda dari titik sumber.",
      );
      return;
    }

    /*
    * Simpan reference source sebelum clearDraft().
    */
    const source = sourceNode;

    /*
    * drawingPoints:
    * [source.position, waypoint1, waypoint2, ...]
    */
    const draftWaypoints = drawingPoints
      .slice(1)
      .map((point) => ({ ...point }));

    const draftPath: Coordinate[] = [
      { ...source.position },
      ...draftWaypoints,
      { ...targetNode.position },
    ];

    /*
    * =========================
    * CREATE PERSISTENCE DRAFT
    * =========================
    */
    const draft: NetworkMapLinkDraft = {
      sourceNodeId: source.id,
      targetNodeId: targetNode.id,
      sourceCode: source.code,
      targetCode: targetNode.code,
      waypoints: draftWaypoints,
      routeLengthMeters:
        calculateRouteLength(draftPath),
    };

    /*
    * Drawing selesai.
    * Permanent route belum dibuat.
    */
    clearDraft();
    setMode("NORMAL");
    callbacks.setInstruction(null);

    /*
    * =========================
    * OPEN DIALOG + WAIT DATABASE
    * =========================
    * null berarti dialog dibatalkan.
    */
    const persisted = await callbacks.requestCreateLink(draft);

    if (!persisted) return;

    /*
    * =========================
    * MOUNT DB LINK
    * =========================
    */
    const link = mountPersistedLink(persisted);
    if (!link) return;

    /*
    * Link baru langsung selected.
    * Hydrated links nanti tidak otomatis selected.
    */
    selectRoute(link);
  }
 

  /*
  * =========================
  * HANDLE NODE CLICK
  * =========================
  * Behavior klik node bergantung pada tool mode.
  */
  function handleNodeClick(
    node: TemporaryNode,
    marker: InstanceType<typeof AdvancedMarkerElement>,
  ) {
    /*
    * =========================
    * NORMAL MODE
    * =========================
    * Klik node hanya memilih node dan
    * membuka Node InfoWindow.
    */
    if (currentMode === "NORMAL") {
      selectNode(node, marker);
      return;
    }

    /*
    * =========================
    * DRAW LINK MODE
    * =========================
    */
    if (currentMode === "DRAW_LINK") {
      /*
      * Klik node pertama menjadi source.
      */
      if (!sourceNode) {
        clearNodeSelection();
        sourceNode = node;

        /* Source route menggunakan warna orange. */
        node.element.style.background = "#f59e0b";

        /* Path draft selalu dimulai dari source. */
        drawingPoints = [{ ...node.position }];
        pointerPosition = null;

        callbacks.setWaypointCount(0);
        callbacks.setSelectedCoordinate(null);
        callbacks.setSelectedPointLabel(null);
        callbacks.setInstruction(
          "Gerakkan cursor lalu klik map untuk waypoint, atau klik titik tujuan.",
        );

        updateDraftLine();
        return;
      }

      /*
      * Source tidak boleh sekaligus menjadi target.
      */
      if (sourceNode.id === node.id) {
        callbacks.setInstruction(
          "Titik tujuan harus berbeda dari titik sumber.",
        );
        return;
      }

      /*
      * Klik node kedua menyelesaikan route.
      */
      finishLink(node);
    }
  }


  /*
  * =========================
  * MAP MOUSE MOVE
  * =========================
  * Menggerakkan ujung draft line mengikuti
  * posisi cursor selama DRAW_LINK aktif.
  */
  const mapMouseMoveListener = map.addListener("mousemove", (event:any) => {
    if (
      currentMode !== "DRAW_LINK" ||
      !sourceNode ||
      !event.latLng
    ) {
      return;
    }

    pointerPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    updateDraftLine();
  });
  /*
  * =========================
  * MAP MOUSE MOVE CLEANUP
  * =========================
  */
  cleanups.push(() => {mapMouseMoveListener.remove()});
  

  /*
  * =========================
  * MAP CLICK
  * =========================
  * Behavior klik area map bergantung
  * pada tool mode yang sedang aktif.
  */
  const mapClickListener = map.addListener("click", (event:any) => {
    if (!event.latLng) return;

    const coordinate: Coordinate = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    /*
    * =========================
    * ADD NODE REQUEST
    * =========================
    * Marker tidak dibuat sebelum database berhasil.
    */
    if (currentMode === "ADD_NODE") {
      setMode("NORMAL");
      callbacks.setInstruction(null);
      callbacks.requestCreateNode(coordinate);
      return;
    }

    /*
    * =========================
    * DRAW LINK WAYPOINT
    * =========================
    */
    if (currentMode === "DRAW_LINK") {
      /*
      * Sebelum source node dipilih, klik area map
      * tidak boleh membuat waypoint.
      */
      if (!sourceNode) {
        callbacks.setInstruction(
          "Klik titik jaringan sebagai sumber jalur.",
        );
        return;
      }

      /*
      * Simpan klik sebagai waypoint permanen draft.
      */
      drawingPoints.push({ ...coordinate });

      /*
      * Pointer lama dibuang. Mousemove berikutnya
      * akan mengisi pointerPosition kembali sehingga
      * live line terus mengikuti cursor.
      */
      pointerPosition = null;

      callbacks.setWaypointCount(
        Math.max(0, drawingPoints.length - 1),
      );

      callbacks.setInstruction(
        "Klik map untuk menambah waypoint lagi atau klik titik tujuan.",
      );

      updateDraftLine();
      return;
    }

    /*
    * =========================
    * ADD WAYPOINT
    * =========================
    * Jangan menerima klik map biasa.
    * Waypoint existing route harus ditambahkan
    * lewat click listener pada polyline.
    */
    if (currentMode === "ADD_WAYPOINT") return;

    /*
    * =========================
    * NORMAL MAP CLICK
    * =========================
    */
    if (currentMode === "NORMAL") {
      clearNodeSelection();
      clearRouteSelection();

      callbacks.setSelectedCoordinate(coordinate);
      callbacks.setSelectedPointLabel("Koordinat dipilih");

      /*
      * placeMarker belum kita migrasikan.
      * Action ini akan diisi pada tahap berikutnya.
      */
      // actions.placeMarker?.(coordinate);

      /*
      * =========================
      * ESCAPE KEY LISTENER
      * =========================
      * ESC membatalkan tool aktif tanpa
      * menghapus topology yang sudah dibuat.
      */
      const escapeKeyListener = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        if (currentMode === "NORMAL") return;

        cancelCurrentTool();
      };

      window.addEventListener("keydown", escapeKeyListener);

      /*
      * =========================
      * ESCAPE KEY CLEANUP
      * =========================
      */
      cleanups.push(() => {
        window.removeEventListener("keydown", escapeKeyListener);
      });
    }
  });
  /*
  * =========================
  * MAP CLICK CLEANUP
  * =========================
  */
  cleanups.push(() => {
    mapClickListener.remove();
  });


  /*
  * =========================
  * PLACE COORDINATE MARKER
  * =========================
  * Marker koordinat biasa untuk klik map NORMAL
  * dan lokasi user. Hanya satu marker yang aktif.
  */
  function placeMarker(coordinate: Coordinate) {
    /* Tutup popup sebelumnya. */
    coordinateInfoWindow.close();

    /*
    * =========================
    * CREATE MARKER ON FIRST USE
    * =========================
    */
    if (!coordinateMarker) {
      const element = document.createElement("div");
      element.style.width = "18px";
      element.style.height = "18px";
      element.style.borderRadius = "9999px";
      element.style.background = "#ef4444";
      element.style.border = "3px solid #ffffff";
      element.style.boxShadow = "0 1px 4px rgba(0,0,0,.35)";

      coordinateMarker = new AdvancedMarkerElement({
        map,
        position: coordinate,
        content: element,
        title: "Lokasi",
        gmpClickable: true,
        anchorLeft: "-50%",
        anchorTop: "-50%",
      });

      /*
      * Klik marker membuka kembali detail koordinat.
      */
      coordinateMarker.addListener("click", () => {
        if (!coordinateMarker?.position) return;

        coordinateInfoWindow.open({
          anchor: coordinateMarker,
          map,
          shouldFocus: false,
        });
      });
    } else {
      /*
      * Marker lama cukup dipindahkan.
      */
      coordinateMarker.position = coordinate;
      coordinateMarker.map = map;
    }

    /*
    * =========================
    * INFO WINDOW CONTENT
    * =========================
    */
    const content = document.createElement("div");
    content.className = "space-y-1 text-sm";

    const title = document.createElement("div");
    title.className = "font-medium";
    title.textContent = "Koordinat";

    const value = document.createElement("div");
    value.className = "text-muted-foreground";
    value.textContent =
      `${coordinate.lat.toFixed(6)}, ${coordinate.lng.toFixed(6)}`;

    content.append(title, value);

    coordinateInfoWindow.setHeaderContent("Lokasi");
    coordinateInfoWindow.setContent(content);
    coordinateInfoWindow.open({
      anchor: coordinateMarker,
      map,
      shouldFocus: false,
    });
  }
  /*
  * =========================
  * EXPOSE PLACE MARKER
  * =========================
  */
  actions.placeMarker = placeMarker;

  /*
  * =========================
  * EXPOSE CLEAR NODE ACTION
  * =========================
  */
  actions.clearNodeSelection = clearNodeSelection;
  /*
  * =========================
  * NODE SELECTION STATE
  * =========================
  * sourceNode:
  * source ketika sedang DRAW_LINK.
  *
  * selectedNodeInternal:
  * node yang sedang selected pada mode NORMAL.
  */
  let sourceNode: TemporaryNode | null = null;
  let selectedNodeInternal: TemporaryNode | null = null;

  /*
  * =========================
  * ROUTE SELECTION STATE
  * =========================
  */
  let selectedLinkInternal: TemporaryLink | null = null;

  /*
  * =========================
  * DRAW LINK STATE
  * =========================
  * drawingPoints berisi:
  * source + waypoint sementara.
  *
  * Target tidak dimasukkan sampai
  * finishLink() dipanggil.
  */
  let drawingPoints: Coordinate[] = [];
  let pointerPosition: Coordinate | null = null;

  /*
  * =========================
  * HYDRATE INITIAL DATA
  * =========================
  */
  hydrateInitialNodes();
  hydrateInitialLinks();

  /*
  * =========================
  * DESTROY MAP ENGINE
  * =========================
  * Membersihkan seluruh imperative runtime
  * Google Maps tanpa mengubah database.
  */
  let destroyed = false;

  function destroy() {
    /* Aman jika destroy dipanggil lebih dari sekali. */
    if (destroyed) return;
    destroyed = true;

    /*
    * =========================
    * DISABLE PUBLIC ACTIONS
    * =========================
    * Setelah engine dihancurkan, React tidak boleh
    * lagi memanggil function runtime lama.
    */
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
    actions.searchNodes = null;
    actions.focusNode = null;
    actions.addPersistedNode = null;
    actions.updateNodePortSummary=null;
    
    /*
    * =========================
    * REMOVE ACTIVE WAYPOINT MARKERS
    * =========================
    * Marker waypoint selected tidak dimasukkan
    * satu per satu ke cleanups, jadi bersihkan
    * secara eksplisit di sini.
    */
    clearWaypointMarkers();

    /*
    * =========================
    * RUN REGISTERED CLEANUPS
    * =========================
    * Jalankan dari belakang agar resource yang
    * dibuat paling akhir dibersihkan lebih dulu.
    */
    for (let index = cleanups.length - 1; index >= 0; index--) {
      cleanups[index]();
    }

    cleanups.length = 0;

    /*
    * =========================
    * RELEASE RUNTIME REFERENCES
    * =========================
    */
    nodes.length = 0;
    nodeMarkers.length = 0;
    links.length = 0;
    selectedWaypointMarkers.length = 0;

    sourceNode = null;
    selectedNodeInternal = null;
    selectedLinkInternal = null;
    drawingPoints = [];
    pointerPosition = null;
    routeInfoPosition = null;
  }

  return {
    map: map as MapController,
    actions,
    destroy,
  };
}