import {z} from "zod";

const capacities=[2,4,8,16,32,64] as const;

export const updateDistributionTopologyNodeSchema=z.object({
  nodeId:z.number().int().positive(),
  code:z.string().trim().min(1).max(100),
  name:z.string().trim().min(1).max(150),
  portCapacity:z.number().int().refine(
    (value)=>capacities.includes(value as typeof capacities[number]),
    "Ratio harus 1:2, 1:4, 1:8, 1:16, 1:32, atau 1:64",
  ),
  inputPowerDbm:z.number().min(-60).max(20).nullable(),
  address:z.string().trim().max(1000).nullable(),
  description:z.string().trim().max(2000).nullable(),
});

export type UpdateDistributionTopologyNodeInput=
  z.infer<typeof updateDistributionTopologyNodeSchema>;