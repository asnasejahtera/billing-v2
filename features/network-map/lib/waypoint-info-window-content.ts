import type { Coordinate } from "../types/network-map.types";

type WaypointInfoWindowContentOptions = {
  index: number;
  position: Coordinate;
  onDeleteRequest: (waypoint: {
    linkId: number;
    index: number;
  }) => void;
  linkId: number;
};

/*
 * =========================
 * WAYPOINT INFO WINDOW
 * =========================
 * DOM hanya menangani tampilan.
 * Delete diteruskan ke React supaya
 * confirmation tetap memakai shadcn.
 */
export function createWaypointInfoWindowContent({
  index,
  position,
  linkId,
  onDeleteRequest,
}: WaypointInfoWindowContentOptions) {
  /* =========================
   * HEADER
   * ========================= */
  const header = document.createElement("div");
  header.className = "pr-2 text-sm font-semibold text-neutral-900";
  header.textContent = `Waypoint ${index + 1}`;

  /* =========================
   * CONTENT
   * ========================= */
  const root = document.createElement("div");
  root.className = "min-w-48 space-y-3 pb-1 text-sm text-neutral-900";

  const coordinate = document.createElement("div");
  const label = document.createElement("p");
  label.className = "text-xs text-neutral-500";
  label.textContent = "Koordinat";
  const value = document.createElement("p");
  value.className = "mt-1 font-mono text-xs";
  value.textContent = `${position.lat.toFixed(7)}, ${position.lng.toFixed(7)}`;
  coordinate.append(label, value);

  /* =========================
   * DELETE REQUEST
   * ========================= */
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className =
    "h-8 w-full rounded-md border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50";
  deleteButton.textContent = "Hapus Waypoint";

  const handleDelete = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDeleteRequest({ linkId, index });
  };

  deleteButton.addEventListener("click", handleDelete);
  root.append(coordinate, deleteButton);

  return {
    header,
    element: root,
    cleanup: () => deleteButton.removeEventListener("click", handleDelete),
  };
}