import { z } from "zod";

export const updateRouterSchema = z.object({
  id: z.coerce
    .number()
    .int("ID router tidak valid")
    .positive("ID router tidak valid"),
  name: z
    .string()
    .trim()
    .min(2, "Nama router minimal 2 karakter")
    .max(100, "Nama router maksimal 100 karakter"),
  host: z
    .string()
    .trim()
    .min(1, "Host wajib diisi")
    .max(255, "Host maksimal 255 karakter"),
  port: z.coerce
    .number()
    .int("Port harus berupa angka")
    .min(1, "Port minimal 1")
    .max(65535, "Port maksimal 65535"),
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi")
    .max(100, "Username maksimal 100 karakter"),
  password: z
    .string()
    .max(255, "Password maksimal 255 karakter")
    .optional()
    .transform((value) => value || undefined),
  useHttps: z.coerce.boolean(),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .transform((value) => value || undefined),
});

export type UpdateRouterInput =
  z.infer<typeof updateRouterSchema>;