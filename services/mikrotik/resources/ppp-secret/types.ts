export type MikroTikPppSecret = {
  ".id"?: string;
  name?: string;
  password?: string;
  profile?: string;
  comment?: string;
  "caller-id"?: string;
  "local-address"?: string;
  "remote-address"?: string;
  disabled?: string;
  service?: string;
};

export type CreateMikroTikPppSecretInput = {
  name: string;
  password: string;
  profile: string;
  comment?: string;
  localAddress?: string | null;
  remoteAddress?: string | null;
  service?: "pppoe";
  disabled?: boolean;
};