export type DeactivateRouterActionState = {
  success?: boolean;
  message?: string;
  errors?: {
    id?: string[];
  };
};

export const initialDeactivateRouterState:
  DeactivateRouterActionState = {};