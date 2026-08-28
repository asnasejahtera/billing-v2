import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama customer wajib diisi")
    .min(2, "Nama customer minimal 2 karakter")
    .max(150, "Nama customer maksimal 150 karakter"),

  phone: optionalText(30),

  routerId: z.coerce
    .number()
    .int("Router tidak valid")
    .positive("Router wajib dipilih"),

  internetPlanId: z.coerce
    .number()
    .int("Paket Internet tidak valid")
    .positive("Paket Internet wajib dipilih"),

  pppoeUsername: z
    .string()
    .trim()
    .min(1, "PPPoE User wajib diisi")
    .max(100, "PPPoE User maksimal 100 karakter"),

  pppoePassword: z
    .string()
    .min(1, "PPPoE Password wajib diisi")
    .max(255, "PPPoE Password maksimal 255 karakter"),

  address: optionalText(500),
  localAddress: optionalText(100),
  remoteAddress: optionalText(100),
  cpeBrand: optionalText(100),
  ontSerialNumber: optionalText(100),
  detail: optionalText(2000),

  status: z
    .enum([
      "ACTIVE",
      "SUSPENDED",
      "INACTIVE",
    ])
    .default("ACTIVE"),
});

export type CreateCustomerInput =
  z.infer<typeof createCustomerSchema>;