import { z } from "zod";

export const updateInternetPlanSchema =
  z.object({
    id: z.coerce
      .number()
      .int("ID paket tidak valid")
      .positive("ID paket tidak valid"),

    name: z
      .string()
      .trim()
      .min(
        2,
        "Nama paket minimal 2 karakter",
      )
      .max(
        150,
        "Nama paket maksimal 150 karakter",
      ),

    price: z.coerce
      .number()
      .int(
        "Harga harus berupa angka",
      )
      .nonnegative(
        "Harga tidak boleh negatif",
      )
      .max(
        999999999999,
        "Harga terlalu besar",
      )
      .transform(String),
  });

export type UpdateInternetPlanInput =
  z.infer<
    typeof updateInternetPlanSchema
  >;