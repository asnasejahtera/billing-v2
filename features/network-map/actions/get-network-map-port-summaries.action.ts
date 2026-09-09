"use server";

import {z} from "zod";
import {getNetworkMapPortSummariesService} from "../services/network-topology-port.service";

const schema=z.object({
  nodeIds:z.array(z.number().int().positive()).min(1).max(20),
});

export async function getNetworkMapPortSummariesAction(
  input:{nodeIds:number[]},
){
  const parsed=schema.safeParse(input);

  if(!parsed.success) return {
    success:false as const,
    message:"ID topology node tidak valid",
  };

  try{
    const data=await getNetworkMapPortSummariesService(parsed.data.nodeIds);
    return {success:true as const,data};
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error
        ?error.message
        :"Gagal mengambil status port",
    };
  }
}