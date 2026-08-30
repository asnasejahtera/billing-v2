/*
 * =========================
 * NODE MARKER ELEMENT
 * =========================
 * Membuat visual temporary network node.
 */
export function createNodeElement(label: string) {
  const element = document.createElement("div");
  element.textContent = label;
  element.style.width = "34px";
  element.style.height = "34px";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.borderRadius = "9999px";
  element.style.background = "#2563eb";
  element.style.color = "#ffffff";
  element.style.border = "2px solid #ffffff";
  element.style.fontSize = "10px";
  element.style.fontWeight = "700";
  element.style.cursor = "pointer";
  element.style.boxShadow = "0 2px 8px rgba(0,0,0,.35)";
  return element;
}

/*
 * =========================
 * WAYPOINT MARKER ELEMENT
 * =========================
 * Marker route dibuat lebih kecil
 * daripada network node utama.
 */
export function createWaypointElement(index: number) {
  const element = document.createElement("div");
  element.textContent = String(index + 1);
  element.style.width = "22px";
  element.style.height = "22px";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.borderRadius = "9999px";
  element.style.background = "#ffffff";
  element.style.color = "#f59e0b";
  element.style.border = "2px solid #f59e0b";
  element.style.fontSize = "10px";
  element.style.fontWeight = "700";
  element.style.boxShadow = "0 2px 6px rgba(0,0,0,.30)";
  return element;
}