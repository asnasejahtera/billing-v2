/*
 * =========================
 * NODE MARKER ELEMENT
 * =========================
 * Membuat visual temporary network node.
 */
export function createNodeElement(nodeType?:string){
  const element=document.createElement("div");
  element.style.width="42px";
  element.style.height="42px";
  element.style.borderRadius="9999px";
  element.style.border="2px solid #ffffff";
  element.style.boxShadow="0 2px 8px rgba(0,0,0,.35)";
  element.style.display="flex";
  element.style.alignItems="center";
  element.style.justifyContent="center";
  element.style.fontSize="10px";
  element.style.fontWeight="700";
  element.style.lineHeight="1";
  element.style.cursor="pointer";
  element.style.userSelect="none";
  element.style.transition="transform 120ms ease,background 120ms ease";
  applyNodeBaseStyle(element,nodeType);
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

/*
 * =========================
 * NODE MARKER
 * =========================
 */
function getNodeMarkerStyle(nodeType?:string){
  switch(nodeType){
    case "ODP":return {label:"ODP",background:"#09090b",color:"#ffffff"};
    case "ODC":return {label:"ODC",background:"#3f3f46",color:"#ffffff"};
    case "OLT":return {label:"OLT",background:"#2563eb",color:"#ffffff"};
    case "CUSTOMER":return {label:"CUST",background:"#2563eb",color:"#ffffff"};
    case "ROUTER":return {label:"RTR",background:"#2563eb",color:"#ffffff"};
    case "POLE":return {label:"POLE",background:"#64748b",color:"#ffffff"};
    default:return {label:"NODE",background:"#2563eb",color:"#ffffff"};
  }
}

export function applyNodeBaseStyle(element:HTMLDivElement,nodeType?:string){
  const style=getNodeMarkerStyle(nodeType);
  element.dataset.nodeType=nodeType??"";
  element.dataset.baseBackground=style.background;
  element.dataset.baseColor=style.color;
  element.textContent=style.label;
  element.style.background=style.background;
  element.style.color=style.color;
}

export function resetNodeElement(element:HTMLElement){
  element.style.background=element.dataset.baseBackground??"#2563eb";
  element.style.color=element.dataset.baseColor??"#ffffff";
  element.style.transform="";
}

export function selectNodeElement(element:HTMLElement){
  element.style.background="#7c3aed";
  element.style.color="#ffffff";
}

export function sourceNodeElement(element:HTMLElement){
  element.style.background="#f59e0b";
  element.style.color="#ffffff";
}

