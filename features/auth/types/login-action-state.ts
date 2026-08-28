export type LoginActionState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export const initialLoginState: LoginActionState = {};
