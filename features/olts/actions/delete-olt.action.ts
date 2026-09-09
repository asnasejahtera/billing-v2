"use server";

import {revalidatePath} from "next/cache";
import {oltIdSchema} from "../schemas/olt.schema";
import {deleteOltService,OltDomainError} from "../services/olt.service";

export async function deleteOltAction(input:unknown){

  const parsed=oltIdSchema.safeParse(input);

  if(!parsed.success){
    return {
      success:false as const,
      message:"ID OLT tidak valid",
    };
  }

  try{
    const data=await deleteOltService(parsed.data);

    revalidatePath("/network/olts");

    return {
      success:true as const,
      message:data.mode==="DELETED"
        ?"OLT berhasil dihapus"
        :"OLT masih digunakan topology sehingga dinonaktifkan, bukan dihapus",
      data,
    };
  }catch(error){
    return {
      success:false as const,
      message:error instanceof OltDomainError
        ?error.message
        :"Gagal menghapus OLT",
    };
  }
}