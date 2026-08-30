import type { TemporaryNode } from "../types/network-map.types";

/*
 * =========================
 * NODE INFO WINDOW OPTIONS
 * =========================
 */
type NodeInfoWindowContentOptions = {
  node: TemporaryNode;
  onDeleteRequest: (node: { id: number; code: string }) => void;
};

/*
 * =========================
 * NODE INFO WINDOW CONTENT
 * =========================
 */
export function createNodeInfoWindowContent({
  node,
  onDeleteRequest,
}: NodeInfoWindowContentOptions) {
  /* =========================
   * HEADER
   * ========================= */
  const header = document.createElement("div");
  header.className = "pr-2 text-sm font-semibold text-neutral-900";
  header.textContent = "Titik Jaringan";

  /* =========================
   * CONTENT
   * ========================= */
  const root = document.createElement("div");
  root.className = "min-w-52 space-y-3 pb-1 text-sm text-neutral-900";

  const title = document.createElement("p");
  title.className = "font-semibold";
  title.textContent = node.code;

  const coordinate = document.createElement("div");
  coordinate.className = "border-t pt-2";

  const coordinateLabel = document.createElement("p");
  coordinateLabel.className = "text-xs text-neutral-500";
  coordinateLabel.textContent = "Koordinat";

  const coordinateValue = document.createElement("p");
  coordinateValue.className = "mt-1 font-mono text-xs";
  coordinateValue.textContent =
    `${node.position.lat.toFixed(7)}, ${node.position.lng.toFixed(7)}`;

  coordinate.append(coordinateLabel, coordinateValue);

  /* =========================
   * DELETE REQUEST
   * ========================= */
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className =
    "h-8 w-full rounded-md border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50";
  deleteButton.textContent = "Hapus Titik";

  /*
 * =========================
 * DELETE NODE REQUEST
 * =========================
 * Stop event agar klik tombol InfoWindow
 * tidak ikut diproses oleh Google Map.
 */
const handleDelete = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  onDeleteRequest({
    id: node.id,
    code: node.code,
  });
};

  deleteButton.addEventListener("click", handleDelete);
  root.append(title, coordinate, deleteButton);

  return {
    header,
    element: root,
    cleanup: () => deleteButton.removeEventListener("click", handleDelete),
  };
}