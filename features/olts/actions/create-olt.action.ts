"use server";

import {revalidatePath} from "next/cache";
// import {requireTenantContext} from "@/lib/tenant/require-tenant-context";
import {createOltSchema} from "../schemas/olt.schema";
import {createOltService,OltDomainError} from "../services/olt.service";

export async function createOltAction(input:unknown){
//   await requireTenantContext();

  const parsed=createOltSchema.safeParse(input);
  if(!parsed.success){
    return {
      success:false as const,
      message:"Data OLT tidak valid",
      errors:parsed.error.flatten().fieldErrors,
    };
  }

  try{
    const data=await createOltService(parsed.data);
    revalidatePath("/network/olts");
    return {
      success:true as const,
      message:`OLT ${data.name} berhasil dibuat`,
      data,
    };
  }catch(error){
    return {
      success:false as const,
      message:error instanceof OltDomainError
        ?error.message
        :"Gagal membuat OLT",
    };
  }
}