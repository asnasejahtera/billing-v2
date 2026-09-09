import {z} from "zod";

const nullableText=(max:number)=>z.string().trim().max(max).transform((value)=>value||null);

export const createOltSchema=z.object({
  name:z.string().trim().min(1,"Nama OLT wajib diisi").max(150),
  brand:nullableText(100),
  model:nullableText(100),
  ponCount:z.coerce.number().int().min(1,"Jumlah PON minimal 1").max(256,"Jumlah PON maksimal 256"),
  baseUrl:z.string().trim().min(1,"Base URL wajib diisi").max(255).refine((value)=>{
    try{
      const protocol=new URL(value).protocol;
      return protocol==="http:"||protocol==="https:";
    }catch{return false;}
  },"Base URL harus berupa http:// atau https:// yang valid"),
  username:z.string().trim().min(1,"Username wajib diisi").max(150),
  password:z.string().min(1,"Password wajib diisi").max(500),
  isActive:z.boolean(),
  description:nullableText(2000),
});

export const oltListQuerySchema=z.object({
  q:z.string().trim().max(150).catch(""),
  status:z.enum(["all","active","inactive"]).catch("all"),
  sort:z.enum(["name","ponCount","createdAt"]).catch("createdAt"),
  order:z.enum(["asc","desc"]).catch("desc"),
  page:z.coerce.number().int().min(1).catch(1),
  pageSize:z.coerce.number().int().refine((value)=>[10,20,50,100].includes(value)).catch(20),
});

export type CreateOltInput=z.infer<typeof createOltSchema>;

export const updateOltSchema=z.object({
  id:z.coerce.number().int().positive(),
  name:z.string().trim().min(1,"Nama OLT wajib diisi").max(150),
  brand:nullableText(100),
  model:nullableText(100),
  ponCount:z.coerce.number().int().min(1,"Jumlah PON minimal 1").max(256,"Jumlah PON maksimal 256"),
  baseUrl:z.string().trim().min(1,"Base URL wajib diisi").max(255).refine((value)=>{
    try{
      const protocol=new URL(value).protocol;
      return protocol==="http:"||protocol==="https:";
    }catch{return false;}
  },"Base URL harus berupa http:// atau https:// yang valid"),
  username:z.string().trim().min(1,"Username wajib diisi").max(150),
  password:z.string().max(500).transform((value)=>value===""?null:value),
  isActive:z.boolean(),
  description:nullableText(2000),
});

export const oltIdSchema=z.coerce.number().int().positive();
export type UpdateOltInput=z.infer<typeof updateOltSchema>;