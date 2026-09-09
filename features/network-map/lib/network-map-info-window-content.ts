import type { TemporaryNode, } from "../types/network-map.types";
import type { NetworkMapNodeDetailTarget ,NetworkMapNodeEditTarget } from "../types/network-map-runtime.types";
import {getCustomerTopologyNodeDetailAction} from "../actions/get-customer-topology-node-detail.action";

type NodeInfoWindowContentOptions = {
  node: TemporaryNode;
  onEditRequest: (node: NetworkMapNodeEditTarget) => void;
  onDeleteRequest: (node: { id: number; code: string }) => void;
  onDetailRequest:(node:NetworkMapNodeDetailTarget)=>void;
};

function getNodeTypeLabel(nodeType?:string){
  switch(nodeType){
    case "ODP":return "ODP";
    case "ODC":return "ODC";
    case "OLT":return "OLT";
    case "CUSTOMER":return "CUSTOMER";
    case "ROUTER":return "ROUTER";
    case "POLE":return "POLE";
    default:return "NETWORK NODE";
  }
}

/*
 * =========================
 * NODE INFO WINDOW CONTENT
 * =========================
 */
export function createNodeInfoWindowContent({
  node,
  onEditRequest,
  onDeleteRequest,
  onDetailRequest
}: NodeInfoWindowContentOptions) {
  /*
   * =========================
   * HEADER
   * =========================
   */
  const header = document.createElement("div");
  header.className = "pr-2 text-sm font-semibold text-neutral-900";
  header.textContent=getNodeTypeLabel(node.nodeType);

  /*
   * =========================
   * CONTENT
   * =========================
   */
  const root = document.createElement("div");
  root.className = "min-w-56 space-y-3 pb-1 text-sm text-neutral-900";

  const title = document.createElement("p");
  title.className = "font-semibold";
  title.textContent = node.code;

  const name = document.createElement("p");
  name.className = "text-xs text-neutral-500";
  name.textContent = node.name ?? node.code;

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

  const portRow=document.createElement("div");
  portRow.className="text-xs text-neutral-600";
  portRow.textContent=node.nodeType==="ODC"||node.nodeType==="ODP"
    ?"Port: belum dikonfigurasi"
    :node.nodeType==="OLT"
      ?"Port: lihat detail PON"
      :"Port: -";
  
  if(node.nodeType==="CUSTOMER"){
    root.append(title, name, createCustomerInfo(node.id), coordinate);
  }else{
    /*
    * =========================
    * PORT SUMMARY
    * =========================
    */
      const ports=document.createElement("div");
      ports.className="space-y-1 rounded-md border bg-neutral-50 p-2";

      const portTitle=document.createElement("div");
      portTitle.className="flex items-center justify-between";

      const portLabel=document.createElement("span");
      portLabel.className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500";
      portLabel.textContent="Port";

      const portHint=document.createElement("span");
      portHint.className="text-[10px] text-neutral-400";
      portHint.textContent="Total / Tersedia";

      portTitle.append(portLabel,portHint);
      ports.append(portTitle);

      if(node.portSummary.inputTotal>0){
        ports.append(
          createPortSummaryRow(
            "INPUT",
            node.portSummary.inputTotal,
            node.portSummary.inputAvailable,
          ),
        );
      }

      if(node.portSummary.outputTotal>0){
        ports.append(
          createPortSummaryRow(
            "OUTPUT",
            node.portSummary.outputTotal,
            node.portSummary.outputAvailable,
          ),
        );
      }

      if(node.portSummary.ponTotal>0){
        ports.append(
          createPortSummaryRow(
            "PON",
            node.portSummary.ponTotal,
            node.portSummary.ponAvailable,
          ),
        );
      }

      root.append(title, name, ports, coordinate);
  }
 

  /*
  * =========================
  * ACTIONS
  * =========================
  */
  const actions=document.createElement("div");
  actions.className="flex items-center gap-2 pt-1";

  const detailButton=document.createElement("button");
  detailButton.type="button";
  detailButton.className="h-8 flex-1 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-800";
  detailButton.textContent="Detail";

  const editButton=document.createElement("button");
  editButton.type="button";
  editButton.className="h-8 rounded-md border px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-50";
  editButton.textContent="Edit";

  const deleteButton=document.createElement("button");
  deleteButton.type="button";
  deleteButton.className="h-8 rounded-md border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50";
  deleteButton.textContent="Hapus";

  const handleDetail=(event:MouseEvent)=>{
    event.preventDefault();
    event.stopPropagation();

    onDetailRequest({
      id:node.id,
      code:node.code,
      name:node.name||node.code,
      nodeType:node.nodeType||"NODE",
      status:node.status||"UNKNOWN",
      position:{...node.position},
      address:node.address??null,
      description:node.description??null,
    });
  };

  const handleEdit=(event:MouseEvent)=>{
    event.preventDefault();
    event.stopPropagation();

    onEditRequest({
      id:node.id,
      code:node.code,
      name:node.name||node.code,
      nodeType:node.nodeType,
      status:node.status||"ACTIVE",
      address:node.address??null,
      description:node.description??null,
    });
  };

  const handleDelete=(event:MouseEvent)=>{
    event.preventDefault();
    event.stopPropagation();

    onDeleteRequest({
      id:node.id,
      code:node.code,
    });
  };

  detailButton.addEventListener("click",handleDetail);
  editButton.addEventListener("click",handleEdit);
  deleteButton.addEventListener("click",handleDelete);

  actions.append(detailButton,editButton,deleteButton);

  // /*
  //  * =========================
  //  * EDIT NODE REQUEST
  //  * =========================
  //  */
  // const handleEdit = (event: MouseEvent) => {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   onEditRequest({
  //     id: node.id,
  //     code: node.code,
  //     name: node.name ?? node.code,
  //     status: node.status ?? "ACTIVE",
  //     address: node.address ?? null,
  //     description: node.description ?? null,
  //   });
  // };

  // /*
  //  * =========================
  //  * DELETE NODE REQUEST
  //  * =========================
  //  */
  // const handleDelete = (event: MouseEvent) => {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   onDeleteRequest({
  //     id: node.id,
  //     code: node.code,
  //   });
  // };

  editButton.addEventListener("click", handleEdit);
  deleteButton.addEventListener("click", handleDelete);

  actions.append(editButton, deleteButton);
  root.append(actions);

  return {
    header,
    element: root,
    cleanup: () => {
      editButton.removeEventListener("click", handleEdit);
      deleteButton.removeEventListener("click", handleDelete);
    },
  };
}


function createPortSummaryRow(
  label:string,
  total:number,
  available:number,
){
  const used=total-available;
  const row=document.createElement("div");
  row.className="flex items-center justify-between text-xs";

  const name=document.createElement("span");
  name.className="text-neutral-600";
  name.textContent=label;

  const value=document.createElement("span");
  value.className="font-semibold text-neutral-900";
  value.textContent=`${total} / ${used}`;

  row.append(name,value);
  return row;
}

function formatCustomerRxPower(value:string|number|null){
  if(value===null||value==="") return "-";

  const text=String(value).trim();

  return /dbm$/i.test(text)
    ?text
    :`${text} dBm`;
}

function getCustomerRemoteHref(value:string){
  const address=value.trim();

  return /^https?:\/\//i.test(address)
    ?address
    :`http://${address}`;
}

type CustomerInfoWindowDetail={
  onuReceivePower:string|number|null;
  onuStatus:string|null;
  remoteAddress:string|null;
};

/*
 * =========================
 * CUSTOMER INFO WINDOW
 * =========================
 */
function createCustomerInfo(
  nodeId:number,
){
  const container=document.createElement("div");
  container.style.marginTop="10px";
  container.style.paddingTop="8px";
  container.style.borderTop="1px solid #e5e7eb";

  const createRow=(label:string)=>{
    const row=document.createElement("div");
    row.style.display="grid";
    row.style.gridTemplateColumns="105px minmax(0,1fr)";
    row.style.gap="8px";
    row.style.padding="3px 0";

    const labelElement=document.createElement("span");
    labelElement.style.fontSize="12px";
    labelElement.style.color="#6b7280";
    labelElement.textContent=label;

    const valueElement=document.createElement("span");
    valueElement.style.fontSize="12px";
    valueElement.style.fontWeight="600";
    valueElement.textContent="Memuat...";

    row.append(
      labelElement,
      valueElement,
    );

    container.append(row);

    return valueElement;
  };

  const rxPowerValue=createRow("RX Power");
  const onuStatusValue=createRow("Status ONU");
  const remoteValue=createRow("Remote Address");

  void getCustomerTopologyNodeDetailAction({
    nodeId,
  }).then((result)=>{
    if(!result.success){
      rxPowerValue.textContent="-";
      onuStatusValue.textContent="-";
      remoteValue.textContent="-";
      return;
    }

    /*
     * Type khusus InfoWindow.
     * Tidak mengubah DTO Customer Detail.
     */
    const detail=
      result.data as unknown as CustomerInfoWindowDetail;

    rxPowerValue.textContent=
      formatCustomerRxPower(
        detail.onuReceivePower,
      );

    onuStatusValue.textContent=
      detail.onuStatus?.trim()||"-";

    remoteValue.textContent="";

    if(!detail.remoteAddress?.trim()){
      remoteValue.textContent="-";
      return;
    }

    const address=
      detail.remoteAddress.trim();

    const link=
      document.createElement("a");

    link.href=
      getCustomerRemoteHref(address);

    link.target="_blank";
    link.rel="noopener noreferrer";
    link.textContent=address;

    link.style.color="#2563eb";
    link.style.fontWeight="600";
    link.style.textDecoration="none";

    link.addEventListener(
      "mouseenter",
      ()=>{
        link.style.textDecoration="underline";
      },
    );

    link.addEventListener(
      "mouseleave",
      ()=>{
        link.style.textDecoration="none";
      },
    );

    remoteValue.append(link);
  });

  return container;
}

function getRemoteAddressHref(value:string){
  const address=value.trim();
  return /^https?:\/\//i.test(address)
    ?address
    :`http://${address}`;
}
