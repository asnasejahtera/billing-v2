"use server";

import {z} from "zod";
import {getDistributionTopologyNodeDetailService} from "../services/network-topology-distribution.service";

const schema=z.object({
  nodeId:z.number().int().positive(),
});

export async function getDistributionTopologyNodeDetailAction(
  input:{nodeId:number},
){
  const parsed=schema.safeParse(input);

  if(!parsed.success)
    return {success:false as const,message:"ID node tidak valid"};

  try{
    const data=await getDistributionTopologyNodeDetailService(parsed.data.nodeId);
    return {success:true as const,data};
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error?error.message:"Gagal mengambil detail ODC/ODP",
    };
  }
}