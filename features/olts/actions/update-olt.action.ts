"use server";

import {revalidatePath} from "next/cache";
import {updateOltSchema} from "../schemas/olt.schema";
import {updateOltService,OltDomainError} from "../services/olt.service";

export async function updateOltAction(input:unknown){

  const parsed=updateOltSchema.safeParse(input);

  if(!parsed.success){
    return {
      success:false as const,
      message:"Data OLT tidak valid",
      errors:parsed.error.flatten().fieldErrors,
    };
  }

  try{
    const data=await updateOltService(parsed.data);

    revalidatePath("/network/olts");

    return {
      success:true as const,
      message:`OLT ${data.name} berhasil diperbarui`,
      data,
    };
  }catch(error){
    return {
      success:false as const,
      message:error instanceof OltDomainError
        ?error.message
        :"Gagal memperbarui OLT",
    };
  }
}