import type { Coordinate } from "./network-map.types";

export type NetworkMapNodeReferenceOption = {
  id: number;
  label: string;
};

export type NetworkMapCreateOptions = {
  routers: NetworkMapNodeReferenceOption[];
  olts: NetworkMapNodeReferenceOption[];
  odcs: NetworkMapNodeReferenceOption[];
  odps: NetworkMapNodeReferenceOption[];
  customers: NetworkMapNodeReferenceOption[];
};

export type NetworkMapNodeDto = {
  id: number;
  code: string;
  name: string;
  nodeType: string;
  position: Coordinate;
  status: string;
  address: string | null;
  description: string | null;
  routerId: number | null;
  oltId: number | null;
  distributionDeviceId: number | null;
  customerId: number | null;
  portSummary:NetworkMapPortSummary;
  customerInfo:NetworkMapCustomerInfo|null;
};

export type NetworkMapNodeEditTarget = {
  id: number;
  code: string;
  name: string;
  status: string;
  address: string | null;
  description: string | null;
};

export type NetworkMapLinkWaypointDto = {
  id: number;
  sequence: number;
  position: Coordinate;
};

export type NetworkMapLinkDto = {
  id: number;
  fiberCableId: number;
  cableName: string;
  sourceNodeId: number;
  targetNodeId: number;
  sourceCode: string;
  targetCode: string;
  cableType: string | null;
  fiberType: string | null;
  coreCount: number;
  estimatedLengthMeters: number | null;
  actualLengthMeters: number | null;
  routeLengthMeters: number;
  attenuationDbPerKm: number | null;
  status: string;
  description: string | null;
  waypoints: NetworkMapLinkWaypointDto[];
};

export type NetworkMapLinkDraft = {
  sourceNodeId: number;
  targetNodeId: number;
  sourceCode: string;
  targetCode: string;
  waypoints: Coordinate[];
  routeLengthMeters: number;
};

export type NetworkMapLinkEditDto = {
  id: number;
  fiberCableId: number;
  sourceCode: string;
  targetCode: string;
  cableName: string;
  cableType: string | null;
  fiberType: string | null;
  coreCount: number;
  estimatedLengthMeters: number | null;
  actualLengthMeters: number | null;
  attenuationDbPerKm: number | null;
  routeLengthMeters: number;
  cableDescription: string | null;
  linkDescription: string | null;
};

export type NetworkMapPortOption={
  id:number;
  nodeId:number;
  name:string;
  portNumber:number;
  portType:string;
  status:string;
};

export type NetworkMapFiberCoreOption={
  id:number;
  cableId:number;
  coreNumber:number;
  color:string|null;
  status:string;
};

export type NetworkMapFiberConnectionDto={
  id:number;
  linkId:number;
  fiberCableId:number;
  coreId:number;
  coreNumber:number;
  coreColor:string|null;
  sourceNodeId:number;
  sourcePortId:number;
  sourcePortName:string;
  targetNodeId:number;
  targetPortId:number;
  targetPortName:string;
  status:string;
  description:string|null;
  connectedAt:string;
};

export type NetworkMapFiberConnectionOptions={
  linkId:number;
  fiberCableId:number;
  sourceNodeId:number;
  targetNodeId:number;
  sourcePorts:NetworkMapPortOption[];
  targetPorts:NetworkMapPortOption[];
  cores:NetworkMapFiberCoreOption[];
};

export type NetworkMapFiberConnectionManagerDto={
  linkId:number;
  fiberCableId:number;
  sourceNodeId:number;
  targetNodeId:number;
  sourcePorts:NetworkMapPortOption[];
  targetPorts:NetworkMapPortOption[];
  cores:NetworkMapFiberCoreOption[];
  connections:NetworkMapFiberConnectionDto[];
};

export type NetworkMapPortSummary={
  inputTotal:number;
  inputAvailable:number;
  outputTotal:number;
  outputAvailable:number;
  ponTotal:number;
  ponAvailable:number;
};

export type NetworkMapNodePortSummaryUpdate={
  nodeId:number;
  portSummary:NetworkMapPortSummary;
};

export type NetworkMapDistributionPortConnection={
  connectionId:number;
  peerNodeId:number;
  peerNodeCode:string;
  peerNodeName:string;
  peerNodeType:string;
  peerPortId:number;
  peerPortName:string;
  cableId:number;
  cableName:string;
  coreId:number;
  coreNumber:number;
  coreColor:null|string;
};

export type NetworkMapDistributionPortDetail={
  id:number;
  portNumber:number;
  name:string;
  portType:string;
  status:string;
  connectorType:string|null;
  measuredPowerDbm:number|null;
  configuredLossDb:number|null;
  actualLossDb:number|null;
  splitPercentage:number|null;
  description:string|null;
  connection:NetworkMapDistributionPortConnection|null;
};

export type NetworkMapDistributionNodeDetailDto={
  nodeId:number;
  deviceId:number;
  nodeType:"ODC"|"ODP";
  code:string;
  name:string;
  status:string;
  address:string|null;
  description:string|null;
  latitude:number;
  longitude:number;
  portCapacity:number;
  splitterType:string;
  splitterRatio:string|null;
  inputPowerDbm:number|null;
  deviceDescription:string|null;
  inputTotal:number;
  inputUsed:number;
  outputTotal:number;
  outputUsed:number;
  ports:NetworkMapDistributionPortDetail[];
};

/*
 * =========================
 * OLT DETAIL
 * =========================
 */
export type NetworkMapOltPonPortDetail={
  id:number;
  ponNumber:number;
  name:string;
  txPowerDbm:number|null;
  description:string|null;

  topologyPortId:number|null;
  topologyPortName:string|null;
  topologyPortStatus:
    |"AVAILABLE"
    |"USED"
    |"RESERVED"
    |"DAMAGED"
    |"DISABLED"
    |null;
  measuredPowerDbm:number|null;
};

export type NetworkMapOltNodeDetailDto={
  nodeId:number;
  code:string;
  name:string;
  nodeType:"OLT";
  status:string;
  latitude:number;
  longitude:number;
  address:string|null;
  description:string|null;

  oltId:number;
  oltName:string;
  brand:string|null;
  model:string|null;
  ponCount:number;
  isActive:boolean;
  oltDescription:string|null;

  physicalPonCount:number;
  mappedPonCount:number;
  availablePonCount:number;
  usedPonCount:number;

  ports:NetworkMapOltPonPortDetail[];
};

export type NetworkMapCustomerOnuConnection={
  connectionId:number;
  peerNodeId:number;
  peerNodeCode:string;
  peerNodeName:string;
  peerNodeType:string;
  peerPortId:number;
  peerPortName:string;
};

export type NetworkMapCustomerOnuPortDetail={
  id:number;
  name:string;
  portNumber:number;
  status:string;
  measuredPowerDbm:number|null;
  connection:NetworkMapCustomerOnuConnection|null;
};

export type NetworkMapCustomerNodeDetailDto={
  nodeId:number;
  customerId:number;
  code:string;
  name:string;
  status:string;

  customerName:string;
  phone:string|null;
  customerStatus:string;
  pppoeUsername:string;
  isOnline:boolean;

  onuStatus:string|null;
  onuReceivePower:string|null;
  onuVendor:string|null;
  onuDeviceType:string|null;
  onuMacAddress:string|null;
  onuDistanceMeters:number|null;

  onuPort:NetworkMapCustomerOnuPortDetail|null;
};

export type NetworkMapCustomerInfo={
  rxPower:string|null;
  onuStatus:string|null;
  remoteAddress:string|null;
};