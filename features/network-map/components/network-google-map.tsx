"use client";
import {
    Loader2,
    MapPin,
    Plus,
    TriangleAlert,
    X,
    Trash2
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
    getGoogleMapsMapId,
    loadMapsLibrary,
    loadMarkerLibrary,
} from "../lib/google-maps-loader";

/*
 * =========================
 * NETWORK MAP TYPES
 * =========================
 */
import type {
    CompletedRoute,
    Coordinate,
    MapController,
    SelectedWaypoint,
    TemporaryNode,
    ToolMode,
} from "../types/network-map.types";

/*
 * =========================
 * MAP GEOMETRY HELPERS
 * =========================
 */
import {
    calculateRouteLength,
    findNearestSegmentIndex,
    formatLength,
    getRouteMidpoint
} from "../lib/network-map-geometry";

import {
    createNodeElement,
    createWaypointElement,
} from "../lib/network-map-marker-elements";

import {
    createNetworkMapOptions,
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
} from "../lib/network-map-config";

import {
    findById,
    findIndexById,
    removeById,
} from "../lib/network-map-registry";

import type {
    NetworkMapActionBridge,
    SelectedWaypointMarker as RuntimeSelectedWaypointMarker,
    TemporaryLink as RuntimeTemporaryLink,
} from "../types/network-map-runtime.types";

import { NetworkMapToolbar } from "./network-map-toolbar";

import { createNodeInfoWindowContent } from "../lib/network-map-info-window-content";
import { createWaypointInfoWindowContent } from "../lib/waypoint-info-window-content";
import { createRouteInfoWindowContent } from "../lib/route-info-window-content";

export function NetworkGoogleMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapController | null>(null,);

    const actionsRef = useRef<NetworkMapActionBridge>({
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
    });

    const clearRouteSelectionRef = useRef<(() => void) | null>(null,);

    const deleteSelectedLinkRef =
        useRef<
            ((linkId: number) => void) | null
        >(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [locationError, setLocationError,] = useState<string | null>(null);
    const [toolMode, setToolMode] = useState<ToolMode>("NORMAL");
    const [instruction, setInstruction,] = useState<string | null>(null);
    const [nodeCount, setNodeCount] = useState(0);
    const [waypointCount, setWaypointCount,] = useState(0);
    const [selectedCoordinate, setSelectedCoordinate,] = useState<Coordinate | null>(null);
    const [selectedPointLabel, setSelectedPointLabel,] = useState<string | null>(null);
    const [completedRoute, setCompletedRoute,] = useState<CompletedRoute | null>(null);
    const [pendingDeleteWaypoint, setPendingDeleteWaypoint] = useState<{ linkId: number; index: number; } | null>(null);

    const [pendingDeleteLink, setPendingDeleteLink] = useState<{ id: number; sourceCode: string; targetCode: string; } | null>(null);
    //  seleted route
    const [pendingDeleteNode, setPendingDeleteNode] = useState<{ id: number; code: string; } | null>(null);

    function requestNodeDelete(node: { id: number; code: string }) {
        setPendingDeleteNode(node);
    }

    useEffect(() => {
        let disposed = false;
        const cleanups: Array<() => void> = [];

        async function initializeMap() {
            let selectedNodeInternal: TemporaryNode | null = null;
            try {
                const [{ Map, Polyline, InfoWindow }, { AdvancedMarkerElement }] = await Promise.all([loadMapsLibrary(), loadMarkerLibrary()]);
                /*
                * =========================
                * GOOGLE MAP RUNTIME TYPES
                * =========================
                * Shared type tetap bebas dari implementasi Google Maps.
                */
                type TemporaryLink = RuntimeTemporaryLink<InstanceType<typeof Polyline>>;
                type SelectedWaypointMarker = RuntimeSelectedWaypointMarker<InstanceType<typeof AdvancedMarkerElement>>;

                if (disposed || !containerRef.current) {
                    return;
                }

                /*
                * =========================
                * GOOGLE MAP INSTANCE
                * =========================
                * Options map dipusatkan di config
                * agar component utama lebih ringkas.
                */
                const map = new Map(containerRef.current, createNetworkMapOptions(getGoogleMapsMapId()));
                mapRef.current = map as MapController;

                /*
                * =========================
                * NODE INFO WINDOW
                * =========================
                * Satu instance dipakai ulang untuk semua node.
                */
                const nodeInfoWindow = new InfoWindow();
                let nodeInfoContentCleanup: (() => void) | null = null;

                function closeNodeInfoContent() {
                    nodeInfoContentCleanup?.();
                    nodeInfoContentCleanup = null;
                }

                /*
                * =========================
                * WAYPOINT INFO WINDOW
                * =========================
                * Satu instance dipakai ulang untuk
                * semua waypoint selected route.
                */
                const waypointInfoWindow = new InfoWindow();
                let waypointInfoContentCleanup: (() => void) | null = null;

                function closeWaypointInfoContent() {
                    waypointInfoContentCleanup?.();
                    waypointInfoContentCleanup = null;
                }

                /*
                * =========================
                * NODE INFO WINDOW CLEANUP
                * =========================
                */
                cleanups.push(() => {
                    closeNodeInfoContent();
                    nodeInfoWindow.close();
                });

                /*
                 * =========================
                 * NORMAL COORDINATE MARKER
                 * =========================
                 */
                const coordinateMarker =
                    new AdvancedMarkerElement({
                        title: "Titik dipilih",
                    });

                function placeCoordinateMarker(coordinate: Coordinate) {
                    coordinateMarker.position = coordinate;
                    coordinateMarker.map = map;
                }
                actionsRef.current.placeMarker = placeCoordinateMarker;

                /*
                 * =========================
                 * TEMPORARY NODES
                 * =========================
                 */
                const nodes: TemporaryNode[] = [];
                const nodeMarkers: Array<InstanceType<typeof AdvancedMarkerElement>> = [];
                let nextNodeId = 1;

                /*
                * =========================
                * TEMPORARY LINKS
                * =========================
                *
                * Setiap link menyimpan:
                * - source node
                * - target node
                * - waypoint
                * - Google Polyline
                * - informasi jalur
                *
                * Dengan struktur ini, endpoint
                * polyline dapat dihitung ulang
                * ketika source/target dipindah.
                */
                const links: TemporaryLink[] = [];
                let nextLinkId = 1;

                /*
                * =========================
                * SELECTED TEMPORARY LINK
                * =========================
                *
                * Menyimpan jalur yang sedang
                * dipilih pada Google Map.
                */
                let selectedLinkInternal: TemporaryLink | null = null;
                const selectedWaypointMarkers: SelectedWaypointMarker[] = [];
                /*
                * =========================
                * RESET WAYPOINT VISUAL
                * =========================
                * Mengembalikan semua waypoint marker
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
                 * TOOL STATE
                 * =========================
                 */

                let currentMode: ToolMode = "NORMAL";
                let sourceNode: TemporaryNode | null = null;

                /*
                 * drawingPoints selalu:
                 *
                 * source
                 * + waypoint
                 * + waypoint
                 *
                 * TARGET belum dimasukkan
                 * sampai marker target diklik.
                 */
                let drawingPoints: Coordinate[] = [];
                let pointerPosition: | Coordinate | null = null;

                /*
                 * =========================
                 * DRAFT LINE
                 * =========================
                 */
                const draftPolyline =
                    new Polyline({
                        strokeColor: "#2563eb",
                        strokeOpacity: 0.9,
                        strokeWeight: 4,
                        clickable: false,
                        zIndex: 100,
                    });

                /*
                 * =========================
                 * MODE MANAGEMENT
                 * =========================
                 */

                function setMode(nextMode: ToolMode) {
                    currentMode = nextMode;
                    setToolMode(nextMode);

                    /*
                    * =========================
                    * NODE DRAG MODE
                    * =========================
                    *
                    * Marker hanya draggable
                    * ketika mode NORMAL.
                    */

                    for (const marker of nodeMarkers) {
                        marker.gmpDraggable =
                            nextMode === "NORMAL";
                    }
                    const drawingMode = nextMode !== "NORMAL";
                    if (containerRef.current) {
                        containerRef.current.style.cursor =
                            drawingMode
                                ? "crosshair"
                                : "";
                    }

                    map.setOptions({
                        draggableCursor:
                            drawingMode
                                ? "crosshair"
                                : null,
                    });
                }

                function clearNodeSelection() {
                    if (selectedNodeInternal && selectedNodeInternal !== sourceNode) {
                        selectedNodeInternal.element.style.background = "#2563eb";
                    }
                    selectedNodeInternal = null;
                    closeNodeInfoContent();
                    nodeInfoWindow.close();
                }

                actionsRef.current.clearRouteSelection = clearRouteSelection;

                /*
                * =========================
                * SELECT NODE
                * =========================
                * Node selection sekarang menggunakan
                * Google Maps InfoWindow, bukan React card.
                */
                function selectNode(node: TemporaryNode, marker: InstanceType<typeof AdvancedMarkerElement>,) {
                    clearRouteSelection();

                    /* Reset marker sebelumnya. */
                    if (
                        selectedNodeInternal &&
                        selectedNodeInternal.id !== node.id &&
                        selectedNodeInternal !== sourceNode
                    ) {
                        selectedNodeInternal.element.style.background = "#2563eb";
                    }

                    selectedNodeInternal = node;
                    node.element.style.background = "#7c3aed";

                    /* Bersihkan content InfoWindow sebelumnya. */
                    closeNodeInfoContent();

                    const content = createNodeInfoWindowContent({
                        node,
                        onDeleteRequest: requestNodeDelete,
                    });

                    nodeInfoContentCleanup = content.cleanup;
                    nodeInfoWindow.setHeaderContent(content.header);
                    nodeInfoWindow.setContent(content.element);
                    nodeInfoWindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: false,
                    });

                    setSelectedCoordinate(null);
                    setSelectedPointLabel(null);
                    setCompletedRoute(null);
                }

                /*
                * =========================
                * INFO WINDOW CLOSE
                * =========================
                * Native X pada Google InfoWindow harus
                * menghapus selection marker juga.
                */
                const nodeInfoCloseListener = nodeInfoWindow.addListener("closeclick", () => {
                    if (selectedNodeInternal && selectedNodeInternal !== sourceNode) {
                        selectedNodeInternal.element.style.background = "#2563eb";
                    }
                    selectedNodeInternal = null;
                    closeNodeInfoContent();
                });

                cleanups.push(() => nodeInfoCloseListener.remove());

                function clearSourceStyle() {
                    if (!sourceNode) {
                        return;
                    }

                    sourceNode.element.style.background =
                        "#2563eb";
                }

                function clearDraft() {
                    clearSourceStyle();
                    sourceNode = null;
                    drawingPoints = [];
                    pointerPosition = null;
                    draftPolyline.setMap(null);
                    setWaypointCount(0);
                }

                /*
                * =========================
                * CANCEL CURRENT TOOL
                * =========================
                */
                function cancelCurrentTool() {
                    const previousMode = currentMode;

                    clearDraft();
                    setMode("NORMAL");
                    setInstruction(null);

                    /*
                     * Jika batal menambah waypoint,
                     * route tetap selected dan popup
                     * route ditampilkan kembali.
                     */
                    if (previousMode === "ADD_WAYPOINT" && selectedLinkInternal) {
                        const position = getRouteMidpoint(buildLinkPath(selectedLinkInternal));
                        if (position) openRouteInfoWindow(selectedLinkInternal, position);
                    }
                }

                /*
                 * =========================
                 * LIVE LINE PREVIEW
                 * =========================
                 */
                function updateDraftLine() {
                    /*
                     * Tidak ada source,
                     * tidak ada garis.
                     */
                    if (
                        currentMode !==
                        "DRAW_LINK" ||
                        !sourceNode ||
                        drawingPoints.length ===
                        0
                    ) {
                        draftPolyline.setMap(null);
                        return;
                    }

                    /*
                     * Source + waypoint yang
                     * sudah diklik.
                     */
                    const path: Coordinate[] =
                        [
                            ...drawingPoints,
                        ];

                    /*
                     * Tambahkan posisi cursor
                     * sebagai titik terakhir
                     * preview.
                     *
                     * INI yang membuat garis
                     * tetap mengikuti cursor
                     * setelah add waypoint.
                     */
                    if (pointerPosition) {
                        path.push(
                            pointerPosition,
                        );
                    }

                    draftPolyline.setPath(path);
                    draftPolyline.setMap(map);
                }

                /*
                * =========================
                * BUILD LINK PATH
                * =========================
                *
                * Path selalu dibentuk dari:
                *
                * source.position
                * + waypoint
                * + target.position
                *
                * Jadi endpoint tidak disimpan
                * sebagai koordinat statis.
                */
                function buildLinkPath(
                    link: TemporaryLink,
                ): Coordinate[] {
                    return [
                        link.sourceNode.position,

                        ...link.waypoints,

                        link.targetNode.position,
                    ];
                }

                /*
                * =========================
                * CLEAR WAYPOINT MARKERS
                * =========================
                */
                function clearWaypointMarkers() {
                    for (
                        const item
                        of selectedWaypointMarkers
                    ) {
                        item.remove();
                    }

                    selectedWaypointMarkers.length =
                        0;
                }

                /*
                * =========================
                * OPEN WAYPOINT INFO WINDOW
                * =========================
                */
                function openWaypointInfoWindow(
                    link: TemporaryLink,
                    index: number,
                    marker: InstanceType<typeof AdvancedMarkerElement>,
                ) {
                    const position = link.waypoints[index];
                    if (!position) return;

                    /*
                     * Node tidak boleh terbuka.
                     * Route InfoWindow ditutup tetapi
                     * route selection TETAP dipertahankan.
                     */
                    clearNodeSelection();
                    closeRouteInfoOnly();
                    closeWaypointInfoContent();

                    const content = createWaypointInfoWindowContent({
                        linkId: link.id,
                        index,
                        position,
                        onDeleteRequest: setPendingDeleteWaypoint,
                    });

                    waypointInfoContentCleanup = content.cleanup;
                    waypointInfoWindow.setHeaderContent(content.header);
                    waypointInfoWindow.setContent(content.element);
                    waypointInfoWindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: false,
                    });
                }

                /*
                * =========================
                * WAYPOINT INFO CLOSE
                * =========================
                */
                const waypointInfoCloseListener = waypointInfoWindow.addListener(
                    "closeclick",
                    () => {
                        closeWaypointInfoContent();
                        resetWaypointSelectionStyle();
                    },
                );

                cleanups.push(() => waypointInfoCloseListener.remove());

                /*
                * =========================
                * RENDER ROUTE WAYPOINTS
                * =========================
                */
                function renderWaypointMarkers(link: TemporaryLink,) {
                    clearWaypointMarkers();
                    link.waypoints.forEach(
                        (waypoint, index) => {
                            /*
                             * =========================
                             * CREATE WAYPOINT UI
                             * =========================
                             */
                            const element = createWaypointElement(index);

                            /*
                             * =========================
                             * CREATE DRAGGABLE MARKER
                             * =========================
                             */
                            const marker =
                                new AdvancedMarkerElement({
                                    map,
                                    position: waypoint,
                                    title: `Waypoint ${index + 1}`,
                                    content: element,
                                    gmpDraggable: true,
                                    gmpClickable: true,
                                });

                            /*
                             * =========================
                             * WAYPOINT DRAG START
                             * =========================
                             *
                             * Beri visual feedback bahwa
                             * waypoint sedang dipindahkan.
                             */
                            const dragStartListener = marker.addListener("dragstart", () => {
                                closeRouteInfoOnly();

                                element.style.background = "#f59e0b";
                                element.style.color = "#ffffff";
                                element.style.transform = "scale(1.15)";
                            });

                            /*
                            * =========================
                            * WAYPOINT CLICK
                            * =========================
                            */
                            const clickListener = marker.addListener("click", () => {
                                /* Reset visual waypoint lain. */
                                for (const item of selectedWaypointMarkers) {
                                    const content = item.marker.content;
                                    if (!(content instanceof HTMLElement)) continue;
                                    content.style.background = "#ffffff";
                                    content.style.color = "#f59e0b";
                                }

                                /* Highlight waypoint aktif. */
                                element.style.background = "#f59e0b";
                                element.style.color = "#ffffff";

                                /* Buka InfoWindow dengan marker sebagai anchor. */
                                openWaypointInfoWindow(link, index, marker);
                            });


                            /*
                             * =========================
                             * WAYPOINT LIVE DRAG
                             * =========================
                             *
                             * Selama waypoint digeser:
                             * - update waypoint di memory
                             * - update polyline realtime
                             *
                             * React state belum diupdate
                             * di sini supaya tidak render
                             * berulang-ulang setiap pixel.
                             */
                            const dragListener =
                                marker.addListener(
                                    "drag",
                                    (event: any) => {
                                        if (!event.latLng) {
                                            return;
                                        }

                                        const newPosition:
                                            Coordinate = {
                                            lat:
                                                event.latLng.lat(),

                                            lng:
                                                event.latLng.lng(),
                                        };

                                        /*
                                         * Update waypoint
                                         * langsung di memory.
                                         */
                                        link.waypoints[index] =
                                            newPosition;

                                        /*
                                         * Rebuild:
                                         *
                                         * source
                                         * + waypoint terbaru
                                         * + target
                                         */
                                        const path =
                                            buildLinkPath(
                                                link,
                                            );

                                        /*
                                         * Update garis realtime
                                         * mengikuti waypoint.
                                         */
                                        link.polyline.setPath(
                                            path,
                                        );
                                    },
                                );

                            /*
                             * =========================
                             * WAYPOINT DRAG END
                             * =========================
                             *
                             * Setelah dilepas:
                             * - pastikan posisi terakhir
                             * - hitung ulang panjang
                             * - update card route
                             * - kembalikan style marker
                             */
                            const dragEndListener =
                                marker.addListener(
                                    "dragend",
                                    (event: any) => {
                                        if (event.latLng) {
                                            link.waypoints[
                                                index
                                            ] = {
                                                lat:
                                                    event.latLng.lat(),

                                                lng:
                                                    event.latLng.lng(),
                                            };
                                        }


                                        updateTemporaryLink(link);
                                        openWaypointInfoWindow(link, index, marker);
                                        /*
                                        * =========================
                                        * REFRESH WAYPOINT INFO
                                        * =========================
                                        */
                                        const content = createWaypointInfoWindowContent({
                                            linkId: link.id,
                                            index,
                                            position: link.waypoints[index],
                                            onDeleteRequest: setPendingDeleteWaypoint,
                                        });

                                        closeWaypointInfoContent();
                                        waypointInfoContentCleanup = content.cleanup;
                                        waypointInfoWindow.setHeaderContent(content.header);
                                        waypointInfoWindow.setContent(content.element);




                                        /*
                                         * Kembalikan style normal
                                         * waypoint selected route.
                                         */
                                        element.style.background =
                                            "#ffffff";

                                        element.style.color =
                                            "#f59e0b";

                                        element.style.transform =
                                            "";
                                    },
                                );

                            /*
                             * =========================
                             * WAYPOINT CLEANUP
                             * =========================
                             *
                             * Cleanup dipanggil oleh
                             * clearWaypointMarkers().
                             */
                            let removed = false;

                            const remove = () => {
                                if (removed) {
                                    return;
                                }

                                removed = true;
                                clickListener.remove();
                                dragStartListener.remove();
                                dragListener.remove();
                                dragEndListener.remove();

                                marker.map = null;
                            };

                            selectedWaypointMarkers.push({
                                marker,
                                remove,
                            });
                        },
                    );
                }

                /*
                 * =========================
                 * CLEAR ROUTE SELECTION
                 * =========================
                 *
                 * Mengembalikan style jalur
                 * terpilih ke style normal.
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
                    setCompletedRoute(null);
                }


                /*
                * =========================
                * ROUTE INFO WINDOW
                * =========================
                * Tidak memiliki marker anchor, sehingga
                * dibuka berdasarkan posisi klik polyline.
                */
                const routeInfoWindow = new InfoWindow();
                let routeInfoContentCleanup: (() => void) | null = null;
                let routeInfoPosition: Coordinate | null = null;

                function closeRouteInfoContent() {
                    routeInfoContentCleanup?.();
                    routeInfoContentCleanup = null;
                }

                /*
                * =========================
                * CLOSE WAYPOINT INFO ONLY
                * =========================
                * Menutup popup waypoint tetapi route
                * dan waypoint markers tetap hidup.
                */
                function closeWaypointInfoOnly() {
                    closeWaypointInfoContent();
                    waypointInfoWindow.close();
                    resetWaypointSelectionStyle();
                    // setSelectedWaypoint(null);
                }

                /*
                 * =========================
                 * CLOSE ROUTE INFO ONLY
                 * =========================
                 * Menutup popup route tanpa membatalkan
                 * selected route / waypoint markers.
                 */
                function closeRouteInfoOnly() {
                    closeRouteInfoContent();
                    routeInfoWindow.close();
                    routeInfoPosition = null;
                }

                /*
                * =========================
                * OPEN ROUTE INFO WINDOW
                * =========================
                */
                function openRouteInfoWindow(link: TemporaryLink, position: Coordinate) {
                    closeRouteInfoContent();

                    const content = createRouteInfoWindowContent({
                        linkId: link.id,
                        sourceCode: link.sourceNode.code,
                        targetCode: link.targetNode.code,
                        lengthMeters: link.routeInfo.lengthMeters,
                        waypointCount: link.waypoints.length,

                        /* Tambah waypoint memakai engine existing. */
                        onAddWaypoint: () => {
                            routeInfoWindow.close();
                            startAddWaypoint();
                        },

                        /* Delete hanya membuka shadcn AlertDialog. */
                        onDeleteRequest: setPendingDeleteLink,
                    });

                    routeInfoPosition = position;
                    routeInfoContentCleanup = content.cleanup;
                    routeInfoWindow.setHeaderContent(content.header);
                    routeInfoWindow.setContent(content.element);
                    routeInfoWindow.setPosition(position);
                    routeInfoWindow.open({ map, shouldFocus: false });
                }

                actionsRef.current.clearRouteSelection = clearRouteSelection;
                /*
                 * =========================
                 * ROUTE INFO WINDOW CLOSE
                 * =========================
                 * Tombol X bawaan Google InfoWindow
                 * membersihkan route selection juga.
                 */
                const routeInfoCloseListener = routeInfoWindow.addListener(
                    "closeclick",
                    () => {
                        clearRouteSelection();
                    },
                );

                cleanups.push(() => { routeInfoCloseListener.remove(); });

                /*
                * =========================
                * SELECT TEMPORARY ROUTE
                * =========================
                *
                * Jalur terpilih dibuat lebih
                * tebal agar jelas pada map.
                */
                function selectRoute(link: TemporaryLink, infoPosition?: Coordinate,) {
                    /* Node InfoWindow harus ditutup. */
                    clearNodeSelection();

                    /* Waypoint popup dari route sebelumnya ditutup. */
                    closeWaypointInfoOnly();

                    /* Kembalikan style route sebelumnya. */
                    if (selectedLinkInternal && selectedLinkInternal.id !== link.id) {
                        selectedLinkInternal.polyline.setOptions({
                            strokeColor: "#2563eb",
                            strokeOpacity: 1,
                            strokeWeight: 5,
                            zIndex: 50,
                        });
                    }

                    selectedLinkInternal = link;

                    link.polyline.setOptions({
                        strokeColor: "#f59e0b",
                        strokeOpacity: 1,
                        strokeWeight: 7,
                        zIndex: 80,
                    });

                    renderWaypointMarkers(link);
                    setSelectedCoordinate(null);
                    setSelectedPointLabel(null);
                    setCompletedRoute({ ...link.routeInfo });

                    const position = infoPosition ?? getRouteMidpoint(buildLinkPath(link));
                    if (position) openRouteInfoWindow(link, position);
                }

                /*
                 * Expose ke React UI.
                 */
                clearRouteSelectionRef.current =
                    clearRouteSelection;

                /*
                 * =========================
                 * UPDATE TEMPORARY LINK
                 * =========================
                 *
                 * Dipanggil ketika salah satu
                 * endpoint node berpindah.
                 *
                 * Fungsi ini:
                 * 1. membuat ulang path
                 * 2. mengupdate Polyline
                 * 3. menghitung ulang panjang
                 * 4. mengupdate card jika link
                 *    tersebut sedang dipilih
                 */
                function updateTemporaryLink(
                    link: TemporaryLink,
                ) {
                    const path =
                        buildLinkPath(link);

                    link.polyline.setPath(
                        path,
                    );

                    /*
                    * =========================
                    * UPDATE ROUTE CALCULATION
                    * =========================
                    */
                    link.routeInfo.lengthMeters =
                        calculateRouteLength(path);

                    link.routeInfo.pointCount =
                        path.length;

                    link.routeInfo.waypointCount =
                        link.waypoints.length;

                    /*
                     * Update card hanya jika
                     * link ini sedang dipilih.
                     */
                    setCompletedRoute(
                        (current) => {
                            if (
                                current?.linkId !==
                                link.id
                            ) {
                                return current;
                            }

                            return {
                                ...link.routeInfo,
                            };
                        },
                    );

                    /*
                    * =========================
                    * REFRESH ROUTE INFO WINDOW
                    * =========================
                    * Saat node/waypoint dipindah, nilai panjang
                    * dan posisi popup ikut diperbarui.
                    */
                    if (selectedLinkInternal?.id === link.id && routeInfoPosition) {
                        const midpoint = getRouteMidpoint(path);
                        if (midpoint) openRouteInfoWindow(link, midpoint);
                    }
                }

                /*
                 * =========================
                 * UPDATE CONNECTED LINKS
                 * =========================
                 *
                 * Cari semua jalur yang source
                 * atau target-nya menggunakan
                 * node yang baru dipindahkan.
                 */
                function updateConnectedLinks(
                    node: TemporaryNode,
                ) {
                    for (const link of links) {
                        const connected =
                            link.sourceNode.id ===
                            node.id ||
                            link.targetNode.id ===
                            node.id;

                        if (!connected) {
                            continue;
                        }

                        updateTemporaryLink(
                            link,
                        );
                    }
                }

                /*
                * =========================
                * SAFE DELETE TEMPORARY LINK
                * =========================
                */
                function deleteTemporaryLink(linkId: number,) {

                    if (currentMode !== "NORMAL") {
                        return;
                    }

                    /*
                     * =========================
                     * FIND LINK
                     * =========================
                     */
                    const linkIndex = links.findIndex((link) => link.id === linkId);
                    if (linkIndex < 0) return;
                    const link = links[linkIndex];

                    /*
                     * =========================
                     * CLEAR SELECTED WAYPOINTS
                     * =========================
                     *
                     * Jika link yang dihapus sedang
                     * selected, waypoint marker yang
                     * tampil harus dibersihkan.
                     */
                    if (selectedLinkInternal?.id === link.id) {
                        clearWaypointMarkers();
                        closeWaypointInfoContent();
                        waypointInfoWindow.close();

                        closeRouteInfoContent();
                        routeInfoWindow.close();
                        routeInfoPosition = null;

                        selectedLinkInternal = null;
                    }

                    /*
                     * =========================
                     * REMOVE GOOGLE POLYLINE
                     * =========================
                     *
                     * remove() sudah dibuat
                     * idempotent pada TemporaryLink,
                     * jadi aman dipanggil lagi saat
                     * component cleanup.
                     */
                    link.remove();

                    /*
                     * =========================
                     * REMOVE LINK FROM MEMORY
                     * =========================
                     */
                    removeById(links, link.id);

                    /*
                     * =========================
                     * CLEAR ROUTE CARD
                     * =========================
                     *
                     * Hanya hilangkan card jika card
                     * tersebut memang milik link yang
                     * baru saja dihapus.
                     */
                    setCompletedRoute(
                        (current) => {
                            if (
                                current?.linkId !==
                                linkId
                            ) {
                                return current;
                            }

                            return null;
                        },
                    );



                    /*
                     * =========================
                     * CLEAR MAP INSTRUCTION
                     * =========================
                     */
                    setInstruction(null);
                }

                /*
                 * =========================
                 * EXPOSE DELETE LINK ACTION
                 * =========================
                 *
                 * React Route Card memanggil
                 * function internal ini melalui ref.
                 */
                actionsRef.current.deleteSelectedLink = deleteTemporaryLink;

                /*
                * =========================
                * DELETE WAYPOINT
                * =========================
                */
                function deleteWaypoint(
                    linkId: number,
                    waypointIndex: number,
                ) {
                    /*
                     * =========================
                     * FIND LINK
                     * =========================
                     */
                    const link = findById(links, linkId);
                    if (!link) return;

                    /*
                     * =========================
                     * VALIDATE WAYPOINT INDEX
                     * =========================
                     */
                    if (
                        waypointIndex < 0 ||
                        waypointIndex >=
                        link.waypoints.length
                    ) {
                        return;
                    }

                    /*
                     * =========================
                     * REMOVE WAYPOINT
                     * =========================
                     */
                    link.waypoints.splice(
                        waypointIndex,
                        1,
                    );

                    /*
                     * =========================
                     * UPDATE ROUTE
                     * =========================
                     *
                     * Rebuild:
                     *
                     * source
                     * + waypoint tersisa
                     * + target
                     *
                     * sekaligus hitung ulang
                     * panjang dan waypointCount.
                     */
                    updateTemporaryLink(
                        link,
                    );

                    /*
                    * =========================
                    * CLOSE WAYPOINT INFO
                    * =========================
                    */
                    closeWaypointInfoContent();
                    waypointInfoWindow.close();

                    /*
                     * =========================
                     * RE-RENDER WAYPOINT MARKERS
                     * =========================
                     *
                     * Marker harus dibuat ulang
                     * supaya numbering kembali:
                     *
                     * (1) (2) (3)
                     */
                    if (
                        selectedLinkInternal?.id ===
                        link.id
                    ) {
                        renderWaypointMarkers(
                            link,
                        );
                    }
                }

                /*
                 * =========================
                 * EXPOSE DELETE WAYPOINT
                 * =========================
                 */
                actionsRef.current.deleteWaypoint = deleteWaypoint;

                /*
                * =========================
                * INSERT WAYPOINT
                * =========================
                *
                * Menambahkan waypoint baru
                * ke segment route yang paling
                * dekat dengan posisi klik.
                */
                function insertWaypoint(link: TemporaryLink, coordinate: Coordinate,) {
                    /*
                     * =========================
                     * BUILD CURRENT PATH
                     * =========================
                     */
                    const path =
                        buildLinkPath(link);

                    /*
                     * =========================
                     * FIND TARGET SEGMENT
                     * =========================
                     *
                     * Contoh:
                     *
                     * source → WP1 → WP2 → target
                     *
                     * Klik antara WP1 dan WP2:
                     * segmentIndex = 1
                     */
                    const segmentIndex =
                        findNearestSegmentIndex(
                            path,
                            coordinate,
                        );

                    /*
                     * =========================
                     * INSERT INTO WAYPOINT ARRAY
                     * =========================
                     *
                     * segment index sama dengan
                     * insertion index waypoint.
                     *
                     * segment 0:
                     * source → WP1
                     * insert waypoint index 0
                     *
                     * segment 1:
                     * WP1 → WP2
                     * insert waypoint index 1
                     */
                    link.waypoints.splice(
                        segmentIndex,
                        0,
                        coordinate,
                    );

                    updateTemporaryLink(link);
                    renderWaypointMarkers(link);
                    setMode("NORMAL");
                    setInstruction(null);
                    openRouteInfoWindow(link, coordinate);
                }

                /*
                 * =========================
                 * FINISH LINK
                 * =========================
                 */

                function finishLink(
                    targetNode: TemporaryNode,
                ) {
                    if (!sourceNode) {
                        return;
                    }

                    if (
                        targetNode.id ===
                        sourceNode.id
                    ) {
                        setInstruction(
                            "Target tidak boleh sama dengan source.",
                        );

                        return;
                    }


                    /*
                    * =========================
                    * CREATE TEMPORARY LINK
                    * =========================
                    *
                    * drawingPoints saat ini:
                    *
                    * [source, waypoint, waypoint]
                    *
                    * Source tidak perlu disimpan
                    * lagi sebagai waypoint karena
                    * sourceNode sudah menyimpannya.
                    */
                    const linkId =
                        nextLinkId++;
                    /*
                     * Ambil waypoint saja.
                     *
                     * index 0 = source,
                     * sisanya = waypoint.
                     */
                    const linkWaypoints =
                        drawingPoints.slice(1);

                    /*
                     * Buat path awal dari node
                     * terbaru + waypoint.
                     */
                    const finalPath:
                        Coordinate[] = [
                            sourceNode.position,

                            ...linkWaypoints,

                            targetNode.position,
                        ];

                    const routeInfo:
                        CompletedRoute = {
                        linkId,

                        sourceCode:
                            sourceNode.code,

                        targetCode:
                            targetNode.code,

                        waypointCount:
                            linkWaypoints.length,

                        pointCount:
                            finalPath.length,

                        lengthMeters:
                            calculateRouteLength(
                                finalPath,
                            ),
                    };

                    /*
                     * Preview drawing selesai.
                     */
                    draftPolyline.setMap(
                        null,
                    );

                    /*
                     * Buat permanent line
                     * yang masih bersifat in-memory.
                     */
                    const permanentLine =
                        new Polyline({
                            map,

                            path: finalPath,

                            strokeColor:
                                "#2563eb",

                            strokeOpacity: 1,

                            strokeWeight: 5,

                            clickable: true,

                            zIndex: 50,
                        });

                    /*
                    * =========================
                    * CREATE TEMPORARY LINK DATA
                    * =========================
                    */
                    const temporaryLink:
                        TemporaryLink = {
                        id: linkId,

                        sourceNode,

                        targetNode,

                        waypoints:
                            linkWaypoints,

                        polyline:
                            permanentLine,

                        routeInfo,

                        remove: () => { },
                    };

                    links.push(
                        temporaryLink,
                    );

                    /*
                    * =========================
                    * SELECT ROUTE ON CLICK
                    * =========================
                    */
                    const lineClick =
                        permanentLine.addListener(
                            "click",
                            (event: any) => {
                                /*
                                 * =========================
                                 * ADD WAYPOINT MODE
                                 * =========================
                                 */
                                if (
                                    currentMode ===
                                    "ADD_WAYPOINT"
                                ) {
                                    /*
                                     * Hanya route yang selected
                                     * yang boleh diedit.
                                     */
                                    if (
                                        selectedLinkInternal?.id !==
                                        temporaryLink.id
                                    ) {
                                        setInstruction(
                                            "Klik jalur yang sedang dipilih.",
                                        );

                                        return;
                                    }

                                    if (!event.latLng) {
                                        return;
                                    }

                                    const coordinate:
                                        Coordinate = {
                                        lat:
                                            event.latLng.lat(),

                                        lng:
                                            event.latLng.lng(),
                                    };

                                    insertWaypoint(
                                        temporaryLink,
                                        coordinate,
                                    );

                                    return;
                                }

                                /*
                                 * =========================
                                 * NORMAL ROUTE SELECT
                                 * =========================
                                 */
                                if (!event.latLng) return;
                                const coordinate: Coordinate = {
                                    lat: event.latLng.lat(),
                                    lng: event.latLng.lng(),
                                };
                                selectRoute(temporaryLink, coordinate);
                            },
                        );
                    /*
                     * =========================
                     * LINK REMOVE HANDLER
                     * =========================
                     *
                     * Function ini dipakai baik
                     * untuk safe delete node maupun
                     * component cleanup.
                     */
                    let linkRemoved = false;

                    temporaryLink.remove =
                        () => {
                            if (linkRemoved) {
                                return;
                            }

                            linkRemoved = true;

                            lineClick.remove();

                            permanentLine.setMap(
                                null,
                            );
                        };

                    /*
                    * =========================
                    * LINK COMPONENT CLEANUP
                    * =========================
                    */
                    cleanups.push(() => {
                        temporaryLink.remove();
                    });

                    /*
                     * =========================
                     * SELECT NEW ROUTE
                     * =========================
                     *
                     * Jalur yang baru selesai
                     * langsung menjadi jalur aktif.
                     */
                    selectRoute(
                        temporaryLink,
                    );

                    /*
                     * Hilangkan preview.
                     */
                    draftPolyline.setMap(
                        null,
                    );


                    cleanups.push(() => {
                        lineClick.remove();

                        permanentLine.setMap(
                            null,
                        );
                    });

                    setSelectedCoordinate(
                        null,
                    );

                    setSelectedPointLabel(
                        null,
                    );

                    setCompletedRoute(
                        routeInfo,
                    );

                    clearDraft();

                    setMode("NORMAL");

                    setInstruction(null);
                }

                /*
                 * =========================
                 * MARKER CLICK
                 * =========================
                 */

                function handleNodeClick(
                    node: TemporaryNode,
                    marker: InstanceType<typeof AdvancedMarkerElement>,
                ) {
                    /*
                    * =========================
                    * ADD WAYPOINT MODE
                    * =========================
                    */
                    if (currentMode === "ADD_WAYPOINT") {
                        setInstruction(
                            "Klik pada jalur yang dipilih, bukan marker node.",
                        );
                        return;
                    }

                    /*
                     * NORMAL MODE
                     */
                    if (currentMode !== "DRAW_LINK") {
                        selectNode(node, marker);
                        map.panTo(node.position,);
                        return;
                    }

                    /*
                     * Belum ada source.
                     *
                     * Marker pertama menjadi
                     * SOURCE.
                     */
                    if (!sourceNode) {
                        clearNodeSelection();
                        sourceNode = node;
                        sourceNode.element.style.background = "#f59e0b";

                        /*
                         * drawingPoints dimulai
                         * dari source marker.
                         */
                        drawingPoints = [node.position];
                        pointerPosition = null;

                        setWaypointCount(0);
                        setSelectedCoordinate(null);

                        setSelectedPointLabel(
                            null,
                        );

                        setInstruction(
                            `${node.code} dipilih sebagai source. Gerakkan cursor, klik map untuk waypoint, atau klik marker target.`,
                        );

                        updateDraftLine();

                        return;
                    }

                    /*
                     * Source sudah ada.
                     *
                     * Marker berikutnya menjadi
                     * TARGET.
                     */
                    finishLink(node);
                }

                /*
                 * =========================
                 * SAFE DELETE TEMPORARY NODE
                 * =========================
                 *
                 * nodeId diberikan langsung dari
                 * React selected-node card.
                 *
                 * Urutan:
                 * 1. cari node dari registry
                 * 2. hapus connected links
                 * 3. hapus marker
                 * 4. hapus node dari memory
                 * 5. update counter
                 * 6. clear selection
                 */
                function deleteTemporaryNode(
                    nodeId: number,
                ) {
                    if (currentMode !== "NORMAL") {
                        return;
                    }

                    /*
                     * =========================
                     * FIND NODE
                     * =========================
                     */
                    const nodeToDelete = findById(nodes, nodeId);
                    if (!nodeToDelete) return;

                    /*
                     * =========================
                     * REMOVE CONNECTED LINKS
                     * =========================
                     *
                     * Loop dari belakang karena
                     * array links akan di-splice.
                     */
                    const removedLinkIds =
                        new Set<number>();

                    for (
                        let index =
                            links.length - 1;
                        index >= 0;
                        index--
                    ) {
                        const link =
                            links[index];

                        const connected =
                            link.sourceNode.id ===
                            nodeToDelete.id ||
                            link.targetNode.id ===
                            nodeToDelete.id;

                        if (!connected) {
                            continue;
                        }

                        removedLinkIds.add(
                            link.id,
                        );

                        /*
                        * =========================
                        * CLEAR SELECTED LINK
                        * =========================
                        */
                        if (
                            selectedLinkInternal?.id ===
                            link.id
                        ) {
                            selectedLinkInternal =
                                null;
                        }

                        /*
                        * =========================
                        * CLEAR SELECTED LINK
                        * =========================
                        *
                        * Jika link yang ikut terhapus
                        * sedang selected, reset pointer.
                        */
                        link.remove();

                        links.splice(
                            index,
                            1,
                        );
                    }

                    /*
                     * =========================
                     * CLEAR DELETED LINK CARD
                     * =========================
                     */
                    setCompletedRoute(
                        (current) => {
                            if (
                                !current ||
                                !removedLinkIds.has(
                                    current.linkId,
                                )
                            ) {
                                return current;
                            }

                            return null;
                        },
                    );

                    /*
                     * =========================
                     * REMOVE NODE MARKER
                     * =========================
                     */
                    nodeToDelete.remove();

                    /*
                    * =========================
                    * REMOVE NODE FROM REGISTRY
                    * =========================
                    */
                    removeById(nodes, nodeToDelete.id);

                    /*
                     * =========================
                     * UPDATE NODE COUNTER
                     * =========================
                     */
                    setNodeCount(
                        nodes.length,
                    );

                    /*
                     * =========================
                     * CLEAR INTERNAL SELECTION
                     * =========================
                     */
                    if (selectedNodeInternal?.id === nodeToDelete.id) {
                        selectedNodeInternal =
                            null;
                    }

                    /*
                     * Jika node yang dihapus sedang
                     * menjadi source draft, reset
                     * drawing state sebagai safeguard.
                     */
                    if (sourceNode?.id === nodeToDelete.id) {
                        clearDraft();
                    }

                    /*
                     * =========================
                     * CLEAR REACT UI STATE
                     * =========================
                     */
                    setSelectedCoordinate(null);
                    setSelectedPointLabel(null);
                    setInstruction(null);
                }

                /*
                 * =========================
                 * EXPOSE DELETE TO REACT
                 * =========================
                 */
                actionsRef.current.deleteSelectedNode = deleteTemporaryNode;

                /*
                 * =========================
                 * CREATE NODE
                 * =========================
                 */

                function createNode(
                    position: Coordinate,
                ) {
                    const id =
                        nextNodeId++;

                    const code =
                        `NODE-${String(
                            id,
                        ).padStart(
                            2,
                            "0",
                        )}`;

                    const element =
                        createNodeElement(
                            String(id),
                        );

                    /*
                    * =========================
                    * CREATE NODE DATA
                    * =========================
                    *
                    * remove sementara dibuat noop.
                    * Setelah marker + listener dibuat,
                    * function ini akan diganti dengan
                    * cleanup sebenarnya.
                    */
                    const node:
                        TemporaryNode = {
                        id,
                        code,
                        position,
                        element,
                        remove: () => { },
                    };

                    nodes.push(node);

                    /*
                    * =========================
                    * CREATE DRAGGABLE MARKER
                    * =========================
                    *
                    * Marker baru langsung draggable
                    * karena create node hanya selesai
                    * kembali ke mode NORMAL.
                    */

                    const marker =
                        new AdvancedMarkerElement({
                            map,
                            position,
                            title: `${code} - drag untuk memindahkan`,
                            content: element,

                            gmpDraggable: true,
                        });

                    const markerClick = marker.addListener("click", () => {
                        handleNodeClick(node, marker);
                    });

                    /*
                    * =========================
                    * NODE REMOVE HANDLER
                    * =========================
                    *
                    * Dibuat idempotent supaya aman
                    * dipanggil ketika node dihapus
                    * dan dipanggil lagi ketika map
                    * component unmount.
                    */
                    let nodeRemoved = false;

                    node.remove = () => {
                        if (nodeRemoved) {
                            return;
                        }

                        nodeRemoved = true;

                        markerClick.remove();

                        markerDragStart.remove();

                        markerDragEnd.remove();

                        marker.map = null;

                        /*
                         * Hapus marker dari registry
                         * draggable agar setMode()
                         * tidak memproses marker yang
                         * sudah tidak ada.
                         */
                        const markerIndex =
                            nodeMarkers.indexOf(marker);

                        if (markerIndex >= 0) {
                            nodeMarkers.splice(
                                markerIndex,
                                1,
                            );
                        }
                    };

                    /*
                     * =========================
                     * NODE COMPONENT CLEANUP
                     * =========================
                     */
                    cleanups.push(() => {
                        node.remove();
                    });
                    /*
                    * =========================
                    * NODE DRAG START
                    * =========================
                    *
                    * Saat marker mulai digeser:
                    * - pastikan hanya mode NORMAL
                    * - node menjadi selected
                    * - warna selected tetap terlihat
                    */

                    const markerDragStart = marker.addListener("dragstart", () => {
                        if (currentMode !== "NORMAL") return;
                        selectNode(node, marker);
                        setInstruction(`${node.code} sedang dipindahkan.`);
                    });

                    /*
                    * =========================
                    * NODE DRAG END
                    * =========================
                    *
                    * Setelah marker dilepas:
                    * 1. baca koordinat marker terbaru
                    * 2. update node.position di memory
                    * 3. update card selectedNode
                    * 4. hapus instruction drag
                    *
                    * Connected line BELUM diubah
                    * pada tahap G1.4.2.
                    */
                    const markerDragEnd =
                        marker.addListener(
                            "dragend",
                            (event: any) => {
                                if (
                                    currentMode !==
                                    "NORMAL" ||
                                    !event.latLng
                                ) {
                                    return;
                                }

                                const newPosition: Coordinate =
                                {
                                    lat:
                                        event.latLng.lat(),

                                    lng:
                                        event.latLng.lng(),
                                };

                                /*
                                 * Update source of truth
                                 * temporary node di memory.
                                 */
                                node.position = newPosition;
                                /*
                                * =========================
                                * UPDATE CONNECTED LINKS
                                * =========================
                                *
                                * Setelah posisi node berubah,
                                * semua polyline yang memakai
                                * node ini sebagai source/target
                                * harus mengikuti posisi baru.
                                */
                                updateConnectedLinks(node);

                                /*
                                * =========================
                                * UPDATE NODE INFO WINDOW
                                * =========================
                                * Jika node yang digeser sedang selected,
                                * InfoWindow mengikuti koordinat terbaru.
                                */
                                if (selectedNodeInternal?.id === node.id) {
                                    closeNodeInfoContent();

                                    const content = createNodeInfoWindowContent({
                                        node,
                                        onDeleteRequest: requestNodeDelete,
                                    });

                                    nodeInfoContentCleanup = content.cleanup;
                                    nodeInfoWindow.setHeaderContent(content.header);
                                    nodeInfoWindow.setContent(content.element);
                                }
                                setInstruction(null);
                            },
                        );

                    setNodeCount(
                        nodes.length,
                    );

                    setSelectedCoordinate(
                        position,
                    );

                    setSelectedPointLabel(
                        code,
                    );

                    return node;
                }

                /*
                 * =========================
                 * START ADD NODE
                 * =========================
                 */

                function startAddNode() {
                    coordinateMarker.map =
                        null;

                    clearDraft();
                    clearNodeSelection();
                    clearRouteSelection();

                    setSelectedCoordinate(
                        null,
                    );

                    setSelectedPointLabel(
                        null,
                    );

                    setCompletedRoute(
                        null,
                    );

                    setMode(
                        "ADD_NODE",
                    );

                    setInstruction(
                        "Klik map untuk menambahkan titik.",
                    );
                }

                /*
                * =========================
                * START ADD WAYPOINT
                * =========================
                *
                * Hanya bisa dilakukan ketika
                * ada route yang selected.
                */
                function startAddWaypoint() {
                    if (!selectedLinkInternal) {
                        return;
                    }

                    /*
                     * Jangan menghapus route
                     * selection karena user sedang
                     * mengedit route tersebut.
                     */
                    setMode("ADD_WAYPOINT");

                    setInstruction(
                        "Klik pada jalur yang dipilih untuk menambahkan waypoint.",
                    );
                }

                /*
                 * =========================
                 * EXPOSE ADD WAYPOINT ACTION
                 * =========================
                 */
                actionsRef.current.startAddWaypoint = startAddWaypoint;


                /*
                 * =========================
                 * START DRAW LINK
                 * =========================
                 */

                function startDrawing() {
                    /*
                     * Butuh minimal source
                     * + target.
                     */
                    if (nodes.length < 2) {
                        setInstruction(
                            "Tambahkan minimal 2 titik terlebih dahulu.",
                        );

                        return;
                    }

                    clearNodeSelection();

                    clearRouteSelection();

                    coordinateMarker.map =
                        null;

                    clearDraft();

                    setSelectedCoordinate(
                        null,
                    );

                    setSelectedPointLabel(
                        null,
                    );

                    setCompletedRoute(
                        null,
                    );

                    setMode(
                        "DRAW_LINK",
                    );

                    setInstruction(
                        "Klik marker yang akan menjadi source.",
                    );
                }

                /*
                 * =========================
                 * UNDO WAYPOINT
                 * =========================
                 */

                function undoWaypoint() {
                    if (
                        currentMode !==
                        "DRAW_LINK" ||
                        !sourceNode ||
                        drawingPoints.length <=
                        1
                    ) {
                        return;
                    }

                    /*
                     * Source selalu index 0.
                     *
                     * Jadi hanya waypoint
                     * terakhir yang dihapus.
                     */
                    drawingPoints =
                        drawingPoints.slice(
                            0,
                            -1,
                        );

                    pointerPosition =
                        null;

                    setWaypointCount(
                        drawingPoints.length -
                        1,
                    );

                    updateDraftLine();

                    setInstruction(
                        "Waypoint terakhir dihapus. Gerakkan cursor, tambah waypoint, atau klik marker target.",
                    );
                }

                /*
                 * Assign refs ke React UI.
                 */
                actionsRef.current.startAddNode = startAddNode;
                actionsRef.current.startDrawing = startDrawing;
                actionsRef.current.cancelTool = cancelCurrentTool;
                actionsRef.current.undoWaypoint = undoWaypoint;

                /*
                 * =========================
                 * MAP CLICK
                 * =========================
                 */

                const mapClickListener =
                    map.addListener(
                        "click",
                        (event: any) => {
                            if (!event.latLng) {
                                return;
                            }

                            const coordinate:
                                Coordinate = {
                                lat:
                                    event.latLng.lat(),

                                lng:
                                    event.latLng.lng(),
                            };

                            /*
                            * =========================
                            * ADD WAYPOINT MAP CLICK
                            * =========================
                            *
                            * Waypoint harus ditambahkan
                            * dengan klik pada polyline,
                            * bukan area map kosong.
                            */
                            if (
                                currentMode ===
                                "ADD_WAYPOINT"
                            ) {
                                setInstruction(
                                    "Klik tepat pada jalur yang dipilih untuk menambahkan waypoint.",
                                );

                                return;
                            }

                            /*
                             * ===================
                             * ADD NODE
                             * ===================
                             */
                            if (
                                currentMode ===
                                "ADD_NODE"
                            ) {
                                createNode(
                                    coordinate,
                                );

                                setMode(
                                    "NORMAL",
                                );

                                setInstruction(
                                    null,
                                );

                                return;
                            }

                            /*
                             * ===================
                             * DRAW LINK
                             * ===================
                             */
                            if (
                                currentMode ===
                                "DRAW_LINK"
                            ) {
                                /*
                                 * Tidak boleh membuat
                                 * waypoint sebelum
                                 * source dipilih.
                                 */
                                if (!sourceNode) {
                                    setInstruction(
                                        "Klik marker source terlebih dahulu.",
                                    );

                                    return;
                                }

                                /*
                                 * Tambahkan waypoint.
                                 */
                                drawingPoints = [
                                    ...drawingPoints,
                                    coordinate,
                                ];

                                /*
                                 * Cursor lama tidak
                                 * boleh dianggap titik
                                 * baru.
                                 */
                                pointerPosition =
                                    null;

                                setWaypointCount(
                                    drawingPoints.length -
                                    1,
                                );

                                setInstruction(
                                    "Waypoint ditambahkan. Gerakkan cursor untuk melanjutkan jalur atau klik marker target.",
                                );

                                /*
                                 * Garis berhenti tepat
                                 * pada waypoint yang
                                 * baru diklik.
                                 */
                                updateDraftLine();

                                return;
                            }

                            /*
                             * ===================
                             * NORMAL CLICK
                             * ===================
                             */

                            clearNodeSelection();

                            clearRouteSelection();

                            placeCoordinateMarker(
                                coordinate,
                            );

                            setCompletedRoute(
                                null,
                            );

                            setSelectedCoordinate(
                                coordinate,
                            );

                            setSelectedPointLabel(
                                "Titik dipilih",
                            );
                        },
                    );

                /*
                 * =========================
                 * LIVE CURSOR
                 * =========================
                 *
                 * Ini WAJIB tetap ada.
                 *
                 * Source:
                 * NODE-01
                 *
                 * lalu:
                 *
                 * NODE-01
                 *   \
                 *    waypoint
                 *       \
                 *        cursor
                 *
                 * Setelah waypoint baru,
                 * mousemove langsung membuat
                 * garis mengikuti cursor lagi.
                 */

                const mouseMoveListener =
                    map.addListener(
                        "mousemove",
                        (event: any) => {
                            if (
                                currentMode !==
                                "DRAW_LINK" ||
                                !sourceNode ||
                                drawingPoints.length ===
                                0 ||
                                !event.latLng
                            ) {
                                return;
                            }

                            pointerPosition = {
                                lat:
                                    event.latLng.lat(),

                                lng:
                                    event.latLng.lng(),
                            };

                            updateDraftLine();
                        },
                    );

                /*
                 * =========================
                 * ESC CANCEL
                 * =========================
                 */

                function handleKeyDown(
                    event: KeyboardEvent,
                ) {
                    if (
                        event.key ===
                        "Escape" &&
                        currentMode !==
                        "NORMAL"
                    ) {
                        cancelCurrentTool();
                    }
                }

                window.addEventListener(
                    "keydown",
                    handleKeyDown,
                );

                /*
                 * =========================
                 * CLEANUP MAP
                 * =========================
                 */

                cleanups.push(() => {
                    mapClickListener.remove();

                    mouseMoveListener.remove();

                    window.removeEventListener(
                        "keydown",
                        handleKeyDown,
                    );

                    coordinateMarker.map =
                        null;

                    draftPolyline.setMap(
                        null,
                    );
                });

                if (!disposed) {
                    setIsLoading(false);
                }
            } catch (error) {
                if (disposed) {
                    return;
                }

                setMapError(
                    error instanceof Error
                        ? error.message
                        : "Google Maps gagal dimuat",
                );

                setIsLoading(false);
            }
        }

        void initializeMap();

        return () => {
            disposed = true;

            for (
                const cleanup
                of cleanups
            ) {
                cleanup();
            }

            mapRef.current = null;

            /*
            * =========================
            * ACTION BRIDGE CLEANUP
            * =========================
            * Lepaskan function engine dari React UI.
            */
            actionsRef.current.placeMarker = null;
            actionsRef.current.startAddNode = null;
            actionsRef.current.startDrawing = null;
            actionsRef.current.startAddWaypoint = null;
            actionsRef.current.cancelTool = null;
            actionsRef.current.undoWaypoint = null;
            actionsRef.current.clearNodeSelection = null;
            actionsRef.current.clearRouteSelection = null;
            actionsRef.current.deleteSelectedNode = null;
            actionsRef.current.deleteWaypoint = null;
            actionsRef.current.deleteSelectedLink = null;
        };
    }, []);

    /*
     * =============================
     * LOKASI SAYA
     * =============================
     */

    function handleMyLocation() {
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError(
                "Browser tidak mendukung geolocation.",
            );

            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coordinate:
                    Coordinate = {
                    lat:
                        position.coords
                            .latitude,

                    lng:
                        position.coords
                            .longitude,
                };

                setCompletedRoute(null);

                setSelectedCoordinate(
                    coordinate,
                );

                setSelectedPointLabel(
                    "Lokasi Saya",
                );

                mapRef.current?.panTo(
                    coordinate,
                );

                mapRef.current?.setZoom(
                    19,
                );

                actionsRef.current.placeMarker?.(coordinate);

                setIsLocating(false);
            },

            (error) => {
                setIsLocating(false);

                if (
                    error.code ===
                    error.PERMISSION_DENIED
                ) {
                    setLocationError(
                        "Izin lokasi ditolak. Aktifkan izin lokasi pada browser.",
                    );

                    return;
                }

                if (
                    error.code ===
                    error.POSITION_UNAVAILABLE
                ) {
                    setLocationError(
                        "Lokasi saat ini tidak tersedia.",
                    );

                    return;
                }

                if (
                    error.code ===
                    error.TIMEOUT
                ) {
                    setLocationError(
                        "Pengambilan lokasi terlalu lama.",
                    );

                    return;
                }

                setLocationError(
                    "Lokasi tidak dapat diakses.",
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 15_000,
                maximumAge: 5_000,
            },
        );
    }

    /*
     * =============================
     * RESET VIEW
     * =============================
     *
     * Tidak menghapus node/jalur.
     * Hanya mengembalikan camera.
     */

    function handleResetMap() {
        mapRef.current?.setCenter(DEFAULT_CENTER);
        mapRef.current?.setZoom(DEFAULT_ZOOM);
    }

    const isDrawing =
        toolMode === "DRAW_LINK";

    const isAddingNode =
        toolMode === "ADD_NODE";

    return (
        <div>
            <div className="flex max-w-full items-center overflow-x-auto pb-1">
                <NetworkMapToolbar
                    toolMode={toolMode}
                    waypointCount={waypointCount}
                    isLocating={isLocating}
                    onAddNode={() => actionsRef.current.startAddNode?.()}
                    onDrawLink={() => actionsRef.current.startDrawing?.()}
                    onMyLocation={handleMyLocation}
                    onResetMap={handleResetMap}
                    onUndoWaypoint={() => actionsRef.current.undoWaypoint?.()}
                    onCancel={() => actionsRef.current.cancelTool?.()}
                />
            </div>

            <AlertDialog
                open={pendingDeleteNode !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteNode(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus {pendingDeleteNode?.code}?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Titik ini akan dihapus dari map sementara. Semua jalur yang
                            terhubung ke titik ini juga akan ikut dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>

                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (!pendingDeleteNode) return;

                                const nodeId = pendingDeleteNode.id;
                                actionsRef.current.deleteSelectedNode?.(nodeId);
                                setPendingDeleteNode(null);
                            }}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* =========================
            DELETE WAYPOINT CONFIRMATION
            ========================= */}
            <AlertDialog
                open={pendingDeleteWaypoint !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteWaypoint(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus Waypoint{" "}
                            {pendingDeleteWaypoint ? pendingDeleteWaypoint.index + 1 : ""}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Waypoint akan dihapus dari jalur. Jalur akan langsung tersambung
                            kembali antara titik sebelum dan sesudah waypoint.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (!pendingDeleteWaypoint) return;
                                actionsRef.current.deleteWaypoint?.(
                                    pendingDeleteWaypoint.linkId,
                                    pendingDeleteWaypoint.index,
                                );
                                setPendingDeleteWaypoint(null);
                            }}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* =========================
                DELETE LINK CONFIRMATION
                ========================= */}
            <AlertDialog
                open={pendingDeleteLink !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteLink(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus jalur?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Jalur{" "}
                            <strong>
                                {pendingDeleteLink?.sourceCode} → {pendingDeleteLink?.targetCode}
                            </strong>{" "}
                            akan dihapus. Titik source dan target tidak akan ikut dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (!pendingDeleteLink) return;
                                actionsRef.current.deleteSelectedLink?.(pendingDeleteLink.id);
                                setPendingDeleteLink(null);
                            }}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="relative h-[calc(100dvh-10rem)] min-h-[520px] overflow-hidden rounded-xl border bg-muted">
                <div
                    ref={containerRef}
                    className="h-full w-full"
                />


                {instruction &&
                    !mapError && (
                        <div className="absolute left-1/2 top-28 z-20 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-lg border bg-background/95 px-3 py-2 text-center text-xs shadow-md backdrop-blur">
                            {instruction}
                        </div>
                    )}

                {/* =========================
                    NODE COUNT
                    ========================= */}
                {!isLoading &&
                    !mapError &&
                    nodeCount > 0 &&
                    toolMode === "NORMAL" && (
                        <div className="absolute right-3 top-16 z-10 rounded-lg border bg-background/90 px-2.5 py-1.5 text-xs shadow backdrop-blur">
                            {nodeCount} titik
                        </div>
                    )}

                {/* =========================
                    LOCATION ERROR
                    ========================= */}

                {locationError &&
                    !mapError && (
                        <div className="absolute bottom-4 right-4 z-20 max-w-xs rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
                            <div className="flex items-start gap-2">
                                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />

                                <div>
                                    <p className="text-sm">
                                        {locationError}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLocationError(
                                                null,
                                            )
                                        }
                                        className="mt-1 text-xs font-medium underline"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                {/* =========================
                    LOADING
                    ========================= */}

                {isLoading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Memuat Google Maps...
                        </div>
                    </div>
                )}

                {/* =========================
                    MAP ERROR
                    ========================= */}

                {mapError && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background">
                        <div className="max-w-md space-y-2 px-4 text-center">
                            <TriangleAlert className="mx-auto size-8 text-destructive" />

                            <p className="font-medium">
                                Google Maps gagal dimuat
                            </p>

                            <p className="text-sm text-muted-foreground">
                                {mapError}
                            </p>
                        </div>
                    </div>
                )}


                {/* =========================
                    COORDINATE / NODE CARD
                    ========================= */}

                {selectedCoordinate &&
                    !completedRoute &&
                    toolMode === "NORMAL" &&
                    !mapError && (
                        <div className="absolute bottom-4 left-4 z-20 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
                            <div className="flex gap-2">
                                <MapPin className="mt-0.5 size-4 shrink-0" />

                                <div>
                                    <p className="text-sm font-medium">
                                        {selectedPointLabel ??
                                            "Titik dipilih"}
                                    </p>

                                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                                        {selectedCoordinate.lat.toFixed(
                                            7,
                                        )}
                                        ,{" "}
                                        {selectedCoordinate.lng.toFixed(
                                            7,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}