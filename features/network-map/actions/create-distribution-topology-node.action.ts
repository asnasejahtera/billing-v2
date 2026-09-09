"use server";

import {
  createDistributionTopologyNodeSchema,
  type CreateDistributionTopologyNodeInput,
} from "../schemas/create-distribution-topology-node.schema";
import {createDistributionTopologyNodeService} from "../services/network-topology-distribution.service";

export async function createDistributionTopologyNodeAction(
  input:CreateDistributionTopologyNodeInput,
){
  const parsed=createDistributionTopologyNodeSchema.safeParse(input);

  if(!parsed.success) return {
    success:false as const,
    message:parsed.error.issues[0]?.message??"Data ODC/ODP tidak valid",
  };

  try{
    const data=await createDistributionTopologyNodeService(parsed.data);
    return {success:true as const,message:`${data.nodeType} berhasil dibuat`,data};
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error?error.message:"Gagal membuat ODC/ODP",
    };
  }
}