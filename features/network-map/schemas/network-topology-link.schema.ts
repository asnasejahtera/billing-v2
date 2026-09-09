import { z } from "zod";

/*
 * =========================
 * CREATE FIBER LINK
 * =========================
 */
export const createNetworkTopologyLinkSchema = z.object({
  sourceNodeId: z.number().int().positive(),
  targetNodeId: z.number().int().positive(),
  cableName: z.string().trim().min(1).max(150),
  cableType: z.string().trim().max(50).nullable().optional(),
  fiberType: z.string().trim().max(50).nullable().optional(),
  coreCount: z.number().int().min(1).max(288),
  estimatedLengthMeters: z.number().positive().nullable().optional(),
  actualLengthMeters: z.number().positive().nullable().optional(),
  attenuationDbPerKm: z.number().min(0).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  waypoints: z.array(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  ),
});

export type CreateNetworkTopologyLinkInput =
  z.infer<typeof createNetworkTopologyLinkSchema>;

/*
 * =========================
 * UPDATE LINK WAYPOINTS
 * =========================
 */
export const updateNetworkTopologyLinkWaypointsSchema = z.object({
  linkId: z.number().int().positive(),
  waypoints: z.array(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  ).max(500),
});

export type UpdateNetworkTopologyLinkWaypointsInput =
  z.infer<typeof updateNetworkTopologyLinkWaypointsSchema>;

/*
 * =========================
 * UPDATE FIBER LINK
 * =========================
 */
export const updateNetworkTopologyLinkSchema = z.object({
  id: z.number().int().positive(),
  cableName: z.string().trim().min(1).max(150),
  cableType: z.string().trim().max(50).nullable().optional(),
  fiberType: z.string().trim().max(50).nullable().optional(),
  estimatedLengthMeters: z.number().positive().nullable().optional(),
  actualLengthMeters: z.number().positive().nullable().optional(),
  attenuationDbPerKm: z.number().min(0).nullable().optional(),
  cableDescription: z.string().trim().max(1000).nullable().optional(),
  linkDescription: z.string().trim().max(1000).nullable().optional(),
});

export type UpdateNetworkTopologyLinkInput =
  z.infer<typeof updateNetworkTopologyLinkSchema>;

/*
 * =========================
 * FIBER CORE CONNECTION
 * =========================
 */
export const createFiberCoreConnectionSchema=z.object({
  linkId:z.number().int().positive(),
  coreId:z.number().int().positive(),
  sourcePortId:z.number().int().positive(),
  targetPortId:z.number().int().positive(),
});
export type CreateFiberCoreConnectionInput=z.infer<typeof createFiberCoreConnectionSchema>;

export const releaseFiberCoreConnectionSchema=z.object({
  id:z.number().int().positive(),
});
export type ReleaseFiberCoreConnectionInput=z.infer<typeof releaseFiberCoreConnectionSchema>;

