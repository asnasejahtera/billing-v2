import { z } from "zod";

const optionalText = (
  max: number,
) =>
  z
    .string()
    .trim()
    .max(max)
    .transform(
      (value) =>
        value || null,
    );

export const updateCustomerSchema =
  z.object({
    id: z.coerce
      .number()
      .int(
        "ID Customer tidak valid",
      )
      .positive(
        "ID Customer tidak valid",
      ),

    name: z
      .string()
      .trim()
      .min(
        1,
        "Nama Customer wajib diisi",
      )
      .min(
        2,
        "Nama Customer minimal 2 karakter",
      )
      .max(
        150,
        "Nama Customer maksimal 150 karakter",
      ),

    phone:
      optionalText(30),

    internetPlanId: z.coerce
      .number()
      .int(
        "Paket Internet tidak valid",
      )
      .positive(
        "Paket Internet wajib dipilih",
      ),

    pppoeUsername: z
      .string()
      .trim()
      .min(
        1,
        "PPPoE User wajib diisi",
      )
      .max(
        100,
        "PPPoE User maksimal 100 karakter",
      ),

    pppoePassword: z
      .string()
      .min(
        1,
        "PPPoE Password wajib diisi",
      )
      .max(
        255,
        "PPPoE Password maksimal 255 karakter",
      ),

    address:
      optionalText(500),

    localAddress:
      optionalText(100),

    remoteAddress:
      optionalText(100),

    cpeBrand:
      optionalText(100),

    ontSerialNumber:
      optionalText(100),

    detail:
      optionalText(2000),

    status: z.enum([
      "ACTIVE",
      "SUSPENDED",
      "INACTIVE",
    ]),
  });

export type UpdateCustomerInput =
  z.infer<
    typeof updateCustomerSchema
  >;

  