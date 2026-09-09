"use server";

import {getOltTopologyNodeDetailSchema} from "../schemas/get-olt-topology-node-detail.schema";
import {getOltTopologyNodeDetailService} from "../services/network-topology-olt.service";

/*
 * =========================
 * GET OLT DETAIL
 * =========================
 */
export async function getOltTopologyNodeDetailAction(input:unknown){
  const parsed=
    getOltTopologyNodeDetailSchema.safeParse(input);

  if(!parsed.success){
    return {
      success:false as const,
      message:"ID node OLT tidak valid",
    };
  }

  try{
    const data=
      await getOltTopologyNodeDetailService(
        parsed.data.nodeId,
      );

    return {
      success:true as const,
      data,
    };
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error
        ?error.message
        :"Gagal mengambil detail OLT",
    };
  }
}