import { z } from "zod";

export const networkTopologyNodeTypes = [
  "ROUTER",
  "OLT",
  "ODC",
  "ODP",
  "CUSTOMER",
  "POLE",
] as const;

export const createNetworkTopologyNodeSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi").max(100),
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  nodeType: z.enum(networkTopologyNodeTypes),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  routerId: z.number().int().positive().nullable().optional(),
  oltId: z.number().int().positive().nullable().optional(),
  distributionDeviceId: z.number().int().positive().nullable().optional(),
  customerId: z.number().int().positive().nullable().optional(),
  address: z.string().trim().max(1000).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export type CreateNetworkTopologyNodeInput =
  z.infer<typeof createNetworkTopologyNodeSchema>;

  /*
 * =========================
 * UPDATE NODE POSITION
 * =========================
 */
export const updateNetworkTopologyNodePositionSchema = z.object({
  id: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type UpdateNetworkTopologyNodePositionInput =
  z.infer<typeof updateNetworkTopologyNodePositionSchema>;

/*
 * =========================
 * UPDATE NODE
 * =========================
 */
export const updateNetworkTopologyNodeSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(150),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  address: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

export type UpdateNetworkTopologyNodeInput =
  z.infer<typeof updateNetworkTopologyNodeSchema>;