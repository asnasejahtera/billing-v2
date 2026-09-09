"use server";

import {updateDistributionTopologyNodeSchema} from "../schemas/update-distribution-topology-node.schema";
import {updateDistributionTopologyNodeService} from "../services/network-topology-distribution.service";

export async function updateDistributionTopologyNodeAction(input:unknown){
  const parsed=updateDistributionTopologyNodeSchema.safeParse(input);

  if(!parsed.success){
    return {
      success:false as const,
      message:parsed.error.issues[0]?.message??"Data ODC/ODP tidak valid",
    };
  }

  try{
    const data=await updateDistributionTopologyNodeService(parsed.data);

    return {
      success:true as const,
      message:"ODC/ODP berhasil diperbarui",
      data,
    };
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error
        ?error.message
        :"Gagal memperbarui ODC/ODP",
    };
  }
}