export type CreateRouterActionState = {
  success?: boolean;
  message?: string;
  errors?: {
    name?: string[];
    host?: string[];
    port?: string[];
    username?: string[];
    password?: string[];
    useHttps?: string[];
    description?: string[];
  };
};

export const initialCreateRouterState:
  CreateRouterActionState = {};