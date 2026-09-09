import {z} from "zod";

export const getCustomerTopologyNodeDetailSchema=z.object({
  nodeId:z.number().int().positive(),
});