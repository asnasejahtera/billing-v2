import { z } from "zod";

export const testRouterConnectionSchema =
  z.object({
    id: z.coerce
      .number()
      .int(
        "ID router tidak valid",
      )
      .positive(
        "ID router tidak valid",
      ),
  });