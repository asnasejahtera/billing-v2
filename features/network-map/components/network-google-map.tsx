"use client";
import {
    Loader2,
    MapPin,
    Plus,
    TriangleAlert,
    X,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    ToolMode,
} from "../types/network-map.types";


import {
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
} from "../lib/network-map-config";

import { createNetworkMapEngine } from "../lib/network-map-engine";

import type {
    NetworkMapActionBridge,
    NetworkMapEngine,
    NetworkMapNodeDetailTarget,
    NetworkMapNodeEditTarget,
    NetworkMapNodeTypeFilter,
    NetworkMapNodeStatusFilter
} from "../types/network-map-runtime.types";

import type {
    NetworkMapCreateOptions,
    NetworkMapLinkDraft,
    NetworkMapLinkDto,
    NetworkMapNodeDto,
} from "../types/network-map-persistence.types";

import { updateNetworkTopologyNodePositionAction } from "../actions/update-network-topology-node-position.action";
import { deleteNetworkTopologyNodeAction } from "../actions/delete-network-topology-node.action";
import { updateNetworkTopologyLinkWaypointsAction } from "../actions/update-network-topology-link-waypoints.action";
import { deleteNetworkTopologyLinkAction } from "../actions/delete-network-topology-link.action";

import { NetworkMapToolbar } from "./network-map-toolbar";
import { NetworkMapNodeFilter } from "./network-map-node-filter";
import { NetworkMapStatusFilter } from "./network-map-status-filter";
import { NetworkMapSearch } from "./network-map-search";
import { CreateNetworkNodeDialog } from "./create-network-node-dialog";
import { EditNetworkNodeDialog } from "./edit-network-node-dialog";
import { CreateFiberLinkDialog } from "./create-fiber-link-dialog";
import { EditFiberLinkDialog } from "./edit-fiber-link-dialog";
import { FiberCoreConnectionDialog } from "./fiber-core-connection-dialog";
import { NetworkNodeDetailDialog } from "./network-node-detail-dialog";
import { EditDistributionTopologyNodeDialog } from "./edit-distribution-topology-node-dialog";

type NetworkGoogleMapProps = {
    initialNodes?: NetworkMapNodeDto[];
    initialLinks?: NetworkMapLinkDto[];
    createOptions: NetworkMapCreateOptions;
};


export function NetworkGoogleMap({ initialNodes, initialLinks, createOptions }: NetworkGoogleMapProps) {
    void createOptions;

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
        searchNodes: null,
        focusNode: null,
        addPersistedNode: null,
        updatePersistedNode: null,
        updateNodePortSummary: null,
        filterNodeType: null,
        filterNodeStatus: null
    });

    // MAP ENGINE RUNTIME
    const engineRef = useRef<NetworkMapEngine | null>(null);

    /*
    * =========================
    * CREATE FIBER LINK
    * =========================
    */
    const [pendingCreateLink, setPendingCreateLink] = useState<NetworkMapLinkDraft | null>(null);
    const createLinkResolverRef = useRef<((link: NetworkMapLinkDto | null) => void) | null>(null);

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
    const [, setSelectedWaypoint] = useState<SelectedWaypoint | null>(null);
    const [pendingDeleteLink, setPendingDeleteLink] = useState<{ id: number; sourceCode: string; targetCode: string; } | null>(null);
    const [pendingDeleteNode, setPendingDeleteNode] = useState<{ id: number; code: string; } | null>(null);
    const [nodeTypeFilter, setNodeTypeFilter] = useState<NetworkMapNodeTypeFilter>("ALL");
    const [nodeStatusFilter, setNodeStatusFilter] = useState<NetworkMapNodeStatusFilter>("ALL");
    /*
    * =========================
    * CREATE NODE DIALOG
    * =========================
    */
    const [pendingCreateCoordinate, setPendingCreateCoordinate] = useState<Coordinate | null>(null);
    const [availableCreateOptions, setAvailableCreateOptions] = useState<NetworkMapCreateOptions>(createOptions);
    /*
     * =========================
     * EDIT NODE
     * =========================
     */
    const [pendingEditNode, setPendingEditNode] = useState<NetworkMapNodeEditTarget | null>(null);
    /*
    * =========================
    * EDIT FIBER LINK
    * =========================
    */
    const [pendingEditLinkId, setPendingEditLinkId,] = useState<number | null>(null);
    /*
    * =========================
    * DELETE NODE STATE
    * =========================
    */
    const [isDeletingNode, setIsDeletingNode] = useState(false);
    const [deleteNodeError, setDeleteNodeError] = useState<string | null>(null);

    /*
    * =========================
    * DELETE LINK STATE
    * =========================
    */
    const [isDeletingLink, setIsDeletingLink] = useState(false);
    const [deleteLinkError, setDeleteLinkError] = useState<string | null>(null);
    const [pendingCoreLinkId, setPendingCoreLinkId] = useState<number | null>(null);
    const [pendingNodeDetail, setPendingNodeDetail] = useState<NetworkMapNodeDetailTarget | null>(null);

    const [pendingDistributionEdit, setPendingDistributionEdit] = useState<NetworkMapNodeEditTarget | null>(null);

    function addCreateOption(items: Array<{ id: number; label: string; }>,
        option: {
            id: number; label: string;
        },
    ) {
        if (items.some((item) => item.id === option.id)) {
            return items;
        }

        return [...items, option].sort((a, b) =>
            a.label.localeCompare(b.label),
        );
    }

    /*
    * =========================
    * PERSIST NODE POSITION
    * =========================
    */
    async function persistNodePosition(input: {
        id: number;
        position: Coordinate;
    }) {
        const result =
            await updateNetworkTopologyNodePositionAction({
                id: input.id,
                latitude: input.position.lat,
                longitude: input.position.lng,
            });

        if (!result.success) {
            return {
                success: false as const,
                message: result.message,
            };
        }

        return {
            success: true as const,
            position: result.data.position,
        };
    }

    /*
    * =========================
    * PERSIST LINK WAYPOINTS
    * =========================
    */
    async function persistLinkWaypoints(input: {
        linkId: number;
        waypoints: Coordinate[];
    }) {
        const result =
            await updateNetworkTopologyLinkWaypointsAction({
                linkId: input.linkId,
                waypoints: input.waypoints,
            });

        if (!result.success) {
            return {
                success: false as const,
                message: result.message,
            };
        }

        return {
            success: true as const,
            routeLengthMeters:
                result.data.routeLengthMeters,
            waypoints:
                result.data.waypoints.map(
                    (waypoint) => ({
                        lat: waypoint.position.lat,
                        lng: waypoint.position.lng,
                    }),
                ),
        };
    }

    /*
    * =========================
    * CONFIRM DELETE FIBER LINK
    * =========================
    */
    async function handleConfirmDeleteLink() {
        if (!pendingDeleteLink || isDeletingLink) {
            return;
        }

        setIsDeletingLink(true);
        setDeleteLinkError(null);

        const result =
            await deleteNetworkTopologyLinkAction({
                id: pendingDeleteLink.id,
            });

        if (!result.success) {
            setDeleteLinkError(result.message);
            setIsDeletingLink(false);
            return;
        }

        /*
         * Database sudah berhasil.
         * Baru hapus Polyline runtime.
         */
        actionsRef.current.deleteSelectedLink?.(
            result.data.id,
        );

        setPendingDeleteLink(null);
        setIsDeletingLink(false);
    }

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let disposed = false;

        async function initializeMap(mapContainer: HTMLDivElement) {
            try {
                setIsLoading(true);
                setMapError(null);

                const engine = await createNetworkMapEngine({
                    container: mapContainer,
                    initialNodes,
                    initialLinks,
                    callbacks: {
                        setToolMode,
                        setInstruction,
                        setNodeCount,
                        setWaypointCount,
                        setSelectedCoordinate,
                        setSelectedPointLabel,
                        setCompletedRoute,
                        setSelectedWaypoint,
                        persistNodePosition,
                        requestNodeDetail: setPendingNodeDetail,
                        requestCreateLink: (draft) =>
                            new Promise<NetworkMapLinkDto | null>((resolve) => {
                                createLinkResolverRef.current?.(null);
                                createLinkResolverRef.current = resolve;
                                setPendingCreateLink(draft);
                            }),
                        requestEditLink: setPendingEditLinkId,
                        requestCreateNode: setPendingCreateCoordinate,
                        requestDeleteNode: (node) => {
                            setDeleteNodeError(null);
                            setPendingDeleteNode(node);
                        },
                        requestDeleteWaypoint: setPendingDeleteWaypoint,
                        requestDeleteLink: (link) => {
                            setDeleteLinkError(null);
                            setPendingDeleteLink(link);
                        },
                        requestEditNode: (node) => {
                            if (node.nodeType === "ODC" || node.nodeType === "ODP") {
                                setPendingDistributionEdit(node);
                                return;
                            }

                            setPendingEditNode(node);
                        },
                        requestManageFiberCores: setPendingCoreLinkId,
                        persistLinkWaypoints,
                    },
                });

                if (disposed) {
                    engine.destroy();
                    return;
                }

                engineRef.current = engine;
                mapRef.current = engine.map;
                actionsRef.current = engine.actions;
                setIsLoading(false);
            } catch (error) {
                if (disposed) return;

                console.error("Failed to initialize network map:", error);
                setMapError(
                    error instanceof Error
                        ? error.message
                        : "Google Maps gagal dimuat.",
                );
                setIsLoading(false);
            }
        }

        void initializeMap(container);

        return () => {
            disposed = true;
            engineRef.current?.destroy();
            engineRef.current = null;
            mapRef.current = null;

            actionsRef.current = {
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
                filterNodeType: null,
                filterNodeStatus: null,
            };
        };
    }, [initialNodes]);

    /*
     * =============================
     * LOKASI SAYA
     * =============================
     */
    function handleMyLocation() {
        setLocationError(null);
        if (!navigator.geolocation) {
            setLocationError("Browser tidak mendukung geolocation.",);
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coordinate:
                    Coordinate = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setCompletedRoute(null);
                setSelectedCoordinate(coordinate);
                setSelectedPointLabel("Lokasi Saya");

                mapRef.current?.panTo(coordinate,);
                mapRef.current?.setZoom(19);
                actionsRef.current.placeMarker?.(coordinate);
                setIsLocating(false);
            },
            (error) => {
                setIsLocating(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError("Izin lokasi ditolak. Aktifkan izin lokasi pada browser.");
                    return;
                }

                if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationError("Lokasi saat ini tidak tersedia.",);
                    return;
                }

                if (error.code === error.TIMEOUT) {
                    setLocationError("Pengambilan lokasi terlalu lama.");
                    return;
                }
                setLocationError("Lokasi tidak dapat diakses.");
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

    /*
    * =========================
    * MAP SEARCH
    * =========================
    */
    function handleSearchNodes(query: string) {
        return actionsRef.current.searchNodes?.(query) ?? [];
    }

    function handleSelectSearchNode(nodeId: number) {
        actionsRef.current.focusNode?.(nodeId);
    }

    /*
    * =========================
    * NODE CREATED
    * =========================
    * Node sudah berhasil tersimpan di Neon.
    * Masukkan ke engine dan keluarkan reference
    * yang sudah digunakan dari pilihan Create.
    */
    function handleNetworkNodeCreated(
        node: NetworkMapNodeDto,
    ) {
        actionsRef.current.addPersistedNode?.(node);

        setAvailableCreateOptions((current) => ({
            routers: node.routerId ? current.routers.filter((item) => item.id !== node.routerId) : current.routers,
            olts: node.oltId ? current.olts.filter((item) => item.id !== node.oltId,) : current.olts,
            odcs: node.nodeType === "ODC" && node.distributionDeviceId ? current.odcs.filter(
                (item) => item.id !== node.distributionDeviceId) : current.odcs,
            odps: node.nodeType === "ODP" && node.distributionDeviceId ? current.odps.filter(
                (item) => item.id !== node.distributionDeviceId,) : current.odps,
            customers: node.customerId ? current.customers.filter((item) => item.id !== node.customerId,) : current.customers,
        }));

        setPendingCreateCoordinate(null);
    }
    /*
    * =========================
    * DELETE NODE
    * =========================
    * Database dihapus lebih dahulu.
    * Runtime map hanya diubah jika DB berhasil.
    */
    async function handleConfirmDeleteNode() {
        if (!pendingDeleteNode || isDeletingNode) return;

        setIsDeletingNode(true);
        setDeleteNodeError(null);

        const result = await deleteNetworkTopologyNodeAction({
            id: pendingDeleteNode.id,
        });

        if (!result.success) {
            setDeleteNodeError(result.message);
            setIsDeletingNode(false);
            return;
        }

        /*
         * DB sudah berhasil.
         * Baru hapus marker dari runtime map.
         */
        actionsRef.current.deleteSelectedNode?.(result.data.id);

        /*
         * Entity yang tadinya terpakai sebagai node
         * dikembalikan ke Create Node options.
         */
        const reference = result.data.releasedReference;

        if (reference) {
            setAvailableCreateOptions((current) => {
                if (reference.type === "ROUTER") {
                    return {
                        ...current,
                        routers: addCreateOption(current.routers, {
                            id: reference.id,
                            label: reference.label,
                        }),
                    };
                }

                if (reference.type === "OLT") {
                    return {
                        ...current,
                        olts: addCreateOption(current.olts, {
                            id: reference.id,
                            label: reference.label,
                        }),
                    };
                }

                if (reference.type === "ODC") {
                    return {
                        ...current,
                        odcs: addCreateOption(current.odcs, {
                            id: reference.id,
                            label: reference.label,
                        }),
                    };
                }

                if (reference.type === "ODP") {
                    return {
                        ...current,
                        odps: addCreateOption(current.odps, {
                            id: reference.id,
                            label: reference.label,
                        }),
                    };
                }

                if (reference.type === "CUSTOMER") {
                    return {
                        ...current,
                        customers: addCreateOption(current.customers, {
                            id: reference.id,
                            label: reference.label,
                        }),
                    };
                }

                return current;
            });
        }

        setPendingDeleteNode(null);
        setIsDeletingNode(false);
    }

    /*
    * =========================
    * NODE UPDATED
    * =========================
    */
    function handleNetworkNodeUpdated(node: NetworkMapNodeDto) {
        actionsRef.current.updatePersistedNode?.(node);
        setPendingEditNode(null);
    }

    function handleNodeTypeFilter(value: NetworkMapNodeTypeFilter) {
        setNodeTypeFilter(value);
        actionsRef.current.filterNodeType?.(
            value,
        );
    }

    /*
    * =========================
    * STATUS FILTER
    * =========================
    */
    function handleNodeStatusFilter(value: NetworkMapNodeStatusFilter,) {
        setNodeStatusFilter(value);
        actionsRef.current.filterNodeStatus?.(value);
    }

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
                <NetworkMapSearch
                    onSearch={handleSearchNodes}
                    onSelect={handleSelectSearchNode}
                />
                <NetworkMapNodeFilter
                    value={nodeTypeFilter}
                    disabled={toolMode !== "NORMAL"}
                    onChange={handleNodeTypeFilter}
                />
                <NetworkMapStatusFilter
                    value={nodeStatusFilter}
                    disabled={toolMode !== "NORMAL"}
                    onChange={handleNodeStatusFilter}
                />
            </div>

            {/* =========================
            DELETE NODE CONFIRMATION
            ========================= */}
            <AlertDialog
                open={pendingDeleteNode !== null}
                onOpenChange={(open) => {
                    if (isDeletingNode) return;

                    if (!open) {
                        setPendingDeleteNode(null);
                        setDeleteNodeError(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus {pendingDeleteNode?.code}?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Titik akan dihapus permanen dari topology.
                            Jika masih digunakan oleh kabel atau port aktif,
                            penghapusan akan ditolak.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteNodeError && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {deleteNodeError}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isDeletingNode}
                        >
                            Batal
                        </AlertDialogCancel>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                isDeletingNode ||
                                !pendingDeleteNode
                            }
                            onClick={() => {
                                void handleConfirmDeleteNode();
                            }}
                        >
                            {isDeletingNode ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4" />
                                    Hapus
                                </>
                            )}
                        </Button>
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
                    if (isDeletingLink) return;

                    if (!open) {
                        setPendingDeleteLink(null);
                        setDeleteLinkError(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus fiber link?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Jalur{" "}
                            <strong>
                                {pendingDeleteLink?.sourceCode}
                                {" → "}
                                {pendingDeleteLink?.targetCode}
                            </strong>{" "}
                            akan dihapus permanen. Source dan target
                            node tidak ikut dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteLinkError && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {deleteLinkError}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isDeletingLink}
                        >
                            Batal
                        </AlertDialogCancel>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                isDeletingLink ||
                                !pendingDeleteLink
                            }
                            onClick={() => {
                                void handleConfirmDeleteLink();
                            }}
                        >
                            {isDeletingLink ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4" />
                                    Hapus
                                </>
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditNetworkNodeDialog
                open={pendingEditNode !== null}
                node={pendingEditNode}
                onOpenChange={(open) => {
                    if (!open) setPendingEditNode(null);
                }}
                onUpdated={handleNetworkNodeUpdated}
            />

            {/* =========================
                NODE DETAIL DIALOG
                ========================= */}
            <NetworkNodeDetailDialog
                open={pendingNodeDetail !== null}
                node={pendingNodeDetail}
                onOpenChange={(open) => {
                    if (!open) setPendingNodeDetail(null);
                }}
            />

            <CreateNetworkNodeDialog
                open={pendingCreateCoordinate !== null}
                coordinate={pendingCreateCoordinate}
                createOptions={availableCreateOptions}
                onOpenChange={(open) => {
                    if (!open) setPendingCreateCoordinate(null);
                }}
                onCreated={handleNetworkNodeCreated}
            />

            <CreateFiberLinkDialog
                open={pendingCreateLink !== null}
                draft={pendingCreateLink}
                onCreated={(link) => {
                    /*
                     * Kembalikan DB DTO ke finishLink().
                     */
                    createLinkResolverRef.current?.(
                        link,
                    );

                    createLinkResolverRef.current = null;
                    setPendingCreateLink(null);
                }}
                onOpenChange={(open) => {
                    if (open) return;

                    /*
                     * Resolver masih ada berarti Dialog
                     * dibatalkan sebelum berhasil save.
                     */
                    createLinkResolverRef.current?.(
                        null,
                    );

                    createLinkResolverRef.current = null;
                    setPendingCreateLink(null);
                }}
            />

            <EditFiberLinkDialog
                open={pendingEditLinkId !== null}
                linkId={pendingEditLinkId}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingEditLinkId(null);
                    }
                }}
            />

            <FiberCoreConnectionDialog
                open={pendingCoreLinkId !== null}
                linkId={pendingCoreLinkId}
                onOpenChange={(open) => {
                    if (!open) setPendingCoreLinkId(null);
                }}
                onPortSummaryChange={(updates) => {
                    for (const update of updates) {
                        actionsRef.current.updateNodePortSummary?.(
                            update.nodeId,
                            update.portSummary,
                        );
                    }
                }}
            />

            <EditDistributionTopologyNodeDialog
                open={pendingDistributionEdit !== null}
                node={pendingDistributionEdit}
                onOpenChange={(open) => {
                    if (!open) setPendingDistributionEdit(null);
                }}
                onUpdated={(node) => {
                    actionsRef.current.updatePersistedNode?.(node);
                    actionsRef.current.updateNodePortSummary?.(
                        node.id,
                        node.portSummary,
                    );

                    setPendingDistributionEdit(null);
                }}
            />

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