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

export interface HsgqPonMac {
  macAddress: string;
  vlanId: number;
  macType: number;
}

export type HsgqOnuRow = HsgqOnuDto & {
  ponMacs: HsgqPonMac[];
};