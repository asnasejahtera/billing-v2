import {z} from "zod";

const allowedPortCapacity=[2,4,8,16,32,64];

export const createDistributionTopologyNodeSchema=z.object({
  code:z.string().trim().min(1).max(100),
  name:z.string().trim().min(1).max(150),
  nodeType:z.enum(["ODC","ODP"]),
  latitude:z.number().min(-90).max(90),
  longitude:z.number().min(-180).max(180),
  portCapacity:z.number().int().refine((value)=>allowedPortCapacity.includes(value),{
    message:"Kapasitas port tidak valid",
  }),
  address:z.string().trim().nullable().optional(),
  description:z.string().trim().nullable().optional(),
});
export type CreateDistributionTopologyNodeInput=z.infer<typeof createDistributionTopologyNodeSchema>;