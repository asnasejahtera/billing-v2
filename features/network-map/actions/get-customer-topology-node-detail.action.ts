"use server";

import {getCustomerTopologyNodeDetailSchema} from "../schemas/get-customer-topology-node-detail.schema";
import {getCustomerTopologyNodeDetailService} from "../services/network-topology-customer.service";

export async function getCustomerTopologyNodeDetailAction(input:unknown){
  const parsed=
    getCustomerTopologyNodeDetailSchema.safeParse(input);

  if(!parsed.success){
    return {
      success:false as const,
      message:"ID customer tidak valid",
    };
  }

  try{
    const data=
      await getCustomerTopologyNodeDetailService(
        parsed.data.nodeId,
      );

    return {
      success:true as const,
      data,
    };
  }catch(error){
    return {
      success:false as const,
      message:error instanceof Error
        ?error.message
        :"Gagal mengambil detail customer",
    };
  }
}