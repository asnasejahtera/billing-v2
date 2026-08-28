export type SyncInternetPlansActionState = {
  success?: boolean;
  message?: string;
  synced?: number;
};

export const initialSyncInternetPlansState:
  SyncInternetPlansActionState = {};