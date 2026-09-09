"use server";
import {z} from "zod";
import {getNetworkMapFiberConnectionOptionsService} from "../services/network-topology-link.service";

const schema=z.object({linkId:z.number().int().positive()});

export async function getFiberConnectionOptionsAction(input:{linkId:number}){
  const parsed=schema.safeParse(input);
  if(!parsed.success) return {success:false as const,message:"ID fiber link tidak valid"};
  try{
    const data=await getNetworkMapFiberConnectionOptionsService(parsed.data.linkId);
    return {success:true as const,data};
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error?error.message:"Gagal mengambil port dan fiber core",
    };
  }
}