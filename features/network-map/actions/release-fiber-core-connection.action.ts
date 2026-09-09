"use server";
import {
  releaseFiberCoreConnectionSchema,
  type ReleaseFiberCoreConnectionInput,
} from "../schemas/network-topology-link.schema";
import {releaseFiberCoreConnectionService} from "../services/network-topology-link.service";

export async function releaseFiberCoreConnectionAction(
  input:ReleaseFiberCoreConnectionInput,
){
  const parsed=releaseFiberCoreConnectionSchema.safeParse(input);

  if(!parsed.success) return {
    success:false as const,
    message:parsed.error.issues[0]?.message??"ID connection tidak valid",
  };

  try{
    const data=await releaseFiberCoreConnectionService(parsed.data);
    return {success:true as const,message:"Fiber core berhasil dilepas",data};
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error?error.message:"Gagal me-release fiber core connection",
    };
  }
}