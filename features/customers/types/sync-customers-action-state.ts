export type SyncCustomersActionState = {
  success?: boolean;
  message?: string;
  created?: number;
  updated?: number;
  skipped?: number;
};

export const initialSyncCustomersState:
  SyncCustomersActionState = {};