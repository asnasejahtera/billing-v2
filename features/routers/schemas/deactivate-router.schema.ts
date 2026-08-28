import { z } from "zod";

export const deactivateRouterSchema = z.object({
  id: z.coerce
    .number()
    .int("ID router tidak valid")
    .positive("ID router tidak valid"),
});

export type DeactivateRouterInput =
  z.infer<typeof deactivateRouterSchema>;