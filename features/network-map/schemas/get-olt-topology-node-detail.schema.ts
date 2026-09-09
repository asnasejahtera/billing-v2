import {z} from "zod";

export const getOltTopologyNodeDetailSchema=z.object({
  nodeId:z.number().int().positive(),
});

export type GetOltTopologyNodeDetailInput=
  z.infer<typeof getOltTopologyNodeDetailSchema>;