export type UpdateRouterActionState = {
  success?: boolean;
  message?: string;
  errors?: {
    id?: string[];
    name?: string[];
    host?: string[];
    port?: string[];
    username?: string[];
    password?: string[];
    useHttps?: string[];
    description?: string[];
  };
};

export const initialUpdateRouterState:
  UpdateRouterActionState = {};