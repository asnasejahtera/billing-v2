export type UpdateCustomerActionState = {
  success?: boolean;
  message?: string;

  errors?: {
    id?: string[];
    name?: string[];
    phone?: string[];
    internetPlanId?: string[];
    pppoeUsername?: string[];
    pppoePassword?: string[];
    address?: string[];
    localAddress?: string[];
    remoteAddress?: string[];
    cpeBrand?: string[];
    ontSerialNumber?: string[];
    detail?: string[];
    status?: string[];
  };
};

export const initialUpdateCustomerState:
  UpdateCustomerActionState = {};