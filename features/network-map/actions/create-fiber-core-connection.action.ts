"use server";
import {
  createFiberCoreConnectionSchema,
  type CreateFiberCoreConnectionInput,
} from "../schemas/network-topology-link.schema";
import {createFiberCoreConnectionService} from "../services/network-topology-link.service";

export async function createFiberCoreConnectionAction(
  input:CreateFiberCoreConnectionInput,
){
  const parsed=createFiberCoreConnectionSchema.safeParse(input);
  if(!parsed.success) return {
    success:false as const,
    message:parsed.error.issues[0]?.message??"Data koneksi fiber tidak valid",
  };

  try{
    const data=await createFiberCoreConnectionService(parsed.data);
    return {success:true as const,message:"Fiber core berhasil dihubungkan",data};
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error?error.message:"Gagal membuat fiber core connection",
    };
  }
}