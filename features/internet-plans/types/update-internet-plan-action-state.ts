export type UpdateInternetPlanActionState = {
  success?: boolean;
  message?: string;
  errors?: {
    id?: string[];
    name?: string[];
    price?: string[];
  };
};

export const initialUpdateInternetPlanState:
  UpdateInternetPlanActionState = {};