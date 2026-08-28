import { z } from "zod";

export const syncCustomersSchema =
  z.object({
    routerId: z.coerce
      .number()
      .int()
      .positive(),
  });