"use server";

import {oltIdSchema} from "../schemas/olt.schema";
import {getOltService,OltDomainError} from "../services/olt.service";

export async function getOltAction(input:unknown){

  const parsed=oltIdSchema.safeParse(input);

  if(!parsed.success){
    return {
      success:false as const,
      message:"ID OLT tidak valid",
    };
  }

  try{
    const data=await getOltService(parsed.data);

    return {
      success:true as const,
      data,
    };
  }catch(error){
    return {
      success:false as const,
      message:error instanceof OltDomainError
        ?error.message
        :"Gagal mengambil OLT",
    };
  }
}