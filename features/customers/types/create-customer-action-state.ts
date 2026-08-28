export type CreateCustomerActionState = {
  success?: boolean;
  message?: string;
  customerId?: number;
  errors?: {
    name?: string[];
    phone?: string[];
    routerId?: string[];
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

export const initialCreateCustomerState:
  CreateCustomerActionState = {};