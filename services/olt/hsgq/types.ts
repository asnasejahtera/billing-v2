export interface HsgqWebClientConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout?: number;
}

export interface HsgqApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

export interface HsgqCurrentUser {
  name: string;
  level: number;
}

export interface HsgqOnuRaw {
  port_id: number;
  onu_id: number;
  onu_name: string;
  onu_desc: string;
  macaddr: string;
  status: string;
  auth_state: number;
  rtt: string;
  distance: number;
  onu_type: string;
  receive_power: string;
  dev_type: string;
  vendor: string;
  register_time: string;
  last_down_time: string;
  last_down_reason: string;
  parent: number;
}

export interface HsgqOnuDto {
  id: string;
  portId: number;
  onuId: number;
  name: string;
  description: string;
  macAddress: string;
  status: string;
  online: boolean;
  authState: boolean;
  rtt: number | null;
  distanceMeters: number | null;
  onuType: string;
  receivePowerDbm: number | null;
  deviceType: string;
  vendor: string;
  registerTime: string | null;
  lastDownTime: string | null;
  lastDownReason: string;
}

export interface HsgqPonMacDto {
  macAddress: string;
  vlanId: number;
  macType: number;
}

export interface HsgqMergedOnuDto extends HsgqOnuDto {
  ponMacs: HsgqPonMacDto[];
}

export interface HsgqOnuSummary {
  total: number;
  online: number;
  offline: number;
  averageRxPowerDbm: number | null;
}

export interface HsgqOnuListResult {
  data: HsgqOnuRow[];
  summary: HsgqOnuSummary;
}

export interface HsgqPonMacRaw {
  macaddr: string;
  vlan_id: number;
  port_id: number;
  onu_id: number;
  mac_type: number;
  onu_name: string;
}

export interface HsgqPonMac {
  macAddress: string;
  vlanId: number;
  macType: number;
}

export type HsgqOnuRow = HsgqOnuDto & {
  ponMacs: HsgqPonMac[];
};