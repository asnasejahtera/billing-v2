import { formatLength } from "./network-map-geometry";

type RouteInfoWindowContentOptions = {
  linkId: number;
  sourceCode: string;
  targetCode: string;
  lengthMeters: number;
  waypointCount: number;
  onAddWaypoint: () => void;
  onDeleteRequest: (link: {
    id: number;
    sourceCode: string;
    targetCode: string;
  }) => void;
};

/*
 * =========================
 * ROUTE INFO WINDOW
 * =========================
 * InfoWindow hanya menangani presentation.
 * Logic map tetap berada di map engine.
 */
export function createRouteInfoWindowContent({
  linkId,
  sourceCode,
  targetCode,
  lengthMeters,
  waypointCount,
  onAddWaypoint,
  onDeleteRequest,
}: RouteInfoWindowContentOptions) {
  /* =========================
   * HEADER
   * ========================= */
  const header = document.createElement("div");
  header.className = "pr-2 text-sm font-semibold text-neutral-900";
  header.textContent = "Jalur";

  /* =========================
   * CONTENT
   * ========================= */
  const root = document.createElement("div");
  root.className = "min-w-56 space-y-3 pb-1 text-sm text-neutral-900";

  const title = document.createElement("p");
  title.className = "font-semibold";
  title.textContent = `${sourceCode} → ${targetCode}`;

  const detail = document.createElement("div");
  detail.className = "grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-2";

  const lengthLabel = document.createElement("span");
  lengthLabel.className = "text-xs text-neutral-500";
  lengthLabel.textContent = "Panjang";
  const lengthValue = document.createElement("span");
  lengthValue.className = "text-right text-xs font-medium";
  lengthValue.textContent = formatLength(lengthMeters);

  const waypointLabel = document.createElement("span");
  waypointLabel.className = "text-xs text-neutral-500";
  waypointLabel.textContent = "Waypoint";
  const waypointValue = document.createElement("span");
  waypointValue.className = "text-right text-xs font-medium";
  waypointValue.textContent = String(waypointCount);

  detail.append(lengthLabel, lengthValue, waypointLabel, waypointValue);

  /* =========================
   * ACTIONS
   * ========================= */
  const actions = document.createElement("div");
  actions.className = "space-y-2 border-t pt-2";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className =
    "h-8 w-full rounded-md border px-3 text-xs font-medium hover:bg-neutral-50";
  addButton.textContent = "Tambah Waypoint";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className =
    "h-8 w-full rounded-md border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50";
  deleteButton.textContent = "Hapus Jalur";

  const handleAdd = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onAddWaypoint();
  };

  const handleDelete = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDeleteRequest({ id: linkId, sourceCode, targetCode });
  };

  addButton.addEventListener("click", handleAdd);
  deleteButton.addEventListener("click", handleDelete);
  actions.append(addButton, deleteButton);
  root.append(title, detail, actions);

  return {
    header,
    element: root,
    cleanup: () => {
      addButton.removeEventListener("click", handleAdd);
      deleteButton.removeEventListener("click", handleDelete);
    },
  };
}