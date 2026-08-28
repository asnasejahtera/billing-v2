export type MikroTikConnectionConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  useTls?: boolean;
  timeout?: number;
};

export type MikroTikIdentity = {
  name: string;
};