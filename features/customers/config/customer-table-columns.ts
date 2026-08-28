export type CustomerColumnId =
  | "name"
  | "phone"
  | "plan"
  | "bandwidthUpTo"
  | "pppoeUsername"
  | "pppoePassword"
  | "address"
  | "ipAddress"
  | "localAddress"
  | "remoteAddress"
  | "router"
  | "cpeBrand"
  | "ontSerialNumber"
  | "uptime"
  | "lastCallerId"
  | "status"
  | "lastLoginAt"
  | "lastLogoutAt";

export type CustomerColumnConfig = {
  id: CustomerColumnId;
  label: string;
  visible: boolean;
};

export const defaultCustomerColumns: CustomerColumnConfig[] = [
  { id: "name", label: "Nama Customer", visible: true },
  { id: "phone", label: "Phone", visible: true },
  { id: "plan", label: "Paket", visible: true },
  { id: "bandwidthUpTo", label: "Bandwidth Up To", visible: true },
  { id: "pppoeUsername", label: "PPPoE User", visible: true },
  { id: "pppoePassword", label: "PPPoE Password", visible: false },
  { id: "address", label: "Alamat Customer", visible: false },
  { id: "ipAddress", label: "IP Address", visible: true },
  { id: "localAddress", label: "Local Address", visible: false },
  { id: "remoteAddress", label: "Remote Address", visible: false },
  { id: "router", label: "Router", visible: true },
  { id: "cpeBrand", label: "Merek Router", visible: false },
  { id: "ontSerialNumber", label: "SN ONT", visible: false },
  { id: "uptime", label: "Uptime", visible: true },
  { id: "lastCallerId", label: "Last Caller ID", visible: false },
  { id: "status", label: "Customer Status", visible: true },
  { id: "lastLoginAt", label: "Last Login", visible: false },
  { id: "lastLogoutAt", label: "Last Logout", visible: false },
];

export const CUSTOMER_COLUMNS_STORAGE_KEY =
  "mikrotik-billing:customer-table-columns:v1";