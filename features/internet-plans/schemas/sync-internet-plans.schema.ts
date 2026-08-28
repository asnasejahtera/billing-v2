import { z } from "zod";

export const syncInternetPlansSchema =
  z.object({
    routerId: z.coerce
      .number()
      .int(
        "ID router tidak valid",
      )
      .positive(
        "ID router tidak valid",
      ),
  });