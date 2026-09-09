import "server-only";

import {db} from "@/db";
import {olts,oltPonPorts} from "@/db/schema/olts";
import type {OltListQuery,OltListResult} from "../types/olt.types";
import {and,asc,count,desc,eq,ilike,inArray,ne,or} from "drizzle-orm";
import {networkTopologyNodes} from "@/db/schema/network-topology-nodes";
import {networkTopologyPorts} from "@/db/schema/network-topology-ports";

type CreateOltRepositoryInput={
  name:string;
  brand:string|null;
  model:string|null;
  ponCount:number;
  baseUrl:string;
  username:string;
  passwordEncrypted:string;
  isActive:boolean;
  description:string|null;
};

/* =========================
 * CREATE
 * ========================= */
export async function findOltByNameRepository(name:string){
  const [row]=await db.select({id:olts.id}).from(olts).where(eq(olts.name,name)).limit(1);
  return row??null;
}

export async function createOltRepository(input:CreateOltRepositoryInput){
  const [row]=await db.insert(olts).values(input).returning({
    id:olts.id,
    name:olts.name,
    brand:olts.brand,
    model:olts.model,
    ponCount:olts.ponCount,
    isActive:olts.isActive,
  });
  if(!row) throw new Error("OLT insert returned no row");
  return row;
}

export async function createOltPonPortsRepository(oltId:number,ponCount:number){
  const values=Array.from({length:ponCount},(_,index)=>{
    const ponNumber=index+1;
    return {
      oltId,
      ponNumber,
      name:`PON-${String(ponNumber).padStart(2,"0")}`,
    };
  });

  return db.insert(oltPonPorts).values(values).returning({
    id:oltPonPorts.id,
    ponNumber:oltPonPorts.ponNumber,
    name:oltPonPorts.name,
  });
}

/* Compensation untuk Neon HTTP yang tidak mendukung transaction. */
export async function rollbackCreatedOltRepository(id:number){
  await db.delete(olts).where(eq(olts.id,id));
}

/* =========================
 * LIST
 * ========================= */
export async function listOltsRepository(query:OltListQuery):Promise<OltListResult>{
  const searchCondition=query.q
    ?or(
      ilike(olts.name,`%${query.q}%`),
      ilike(olts.brand,`%${query.q}%`),
      ilike(olts.model,`%${query.q}%`),
    )
    :undefined;

  const statusCondition=query.status==="active"
    ?eq(olts.isActive,true)
    :query.status==="inactive"
      ?eq(olts.isActive,false)
      :undefined;

  const where=searchCondition&&statusCondition
    ?and(searchCondition,statusCondition)
    :searchCondition??statusCondition;

  const sortColumn=query.sort==="name"
    ?olts.name
    :query.sort==="ponCount"
      ?olts.ponCount
      :olts.createdAt;

  const orderBy=query.order==="asc"?asc(sortColumn):desc(sortColumn);
  const offset=(query.page-1)*query.pageSize;

  const [data,totalRows]=await Promise.all([
    db.select({
      id:olts.id,
      name:olts.name,
      brand:olts.brand,
      model:olts.model,
      ponCount:olts.ponCount,
      isActive:olts.isActive,
      createdAt:olts.createdAt,
    }).from(olts).where(where).orderBy(orderBy).limit(query.pageSize).offset(offset),

    db.select({value:count()}).from(olts).where(where),
  ]);

  const total=Number(totalRows[0]?.value??0);
  return {
    data,
    page:query.page,
    pageSize:query.pageSize,
    total,
    totalPages:Math.max(1,Math.ceil(total/query.pageSize)),
  };
}

/* =========================
 * DETAIL / EDIT
 * ========================= */
export async function findOltForEditRepository(id:number){
  const [row]=await db.select({
    id:olts.id,
    name:olts.name,
    brand:olts.brand,
    model:olts.model,
    ponCount:olts.ponCount,
    baseUrl:olts.baseUrl,
    username:olts.username,
    passwordEncrypted:olts.passwordEncrypted,
    isActive:olts.isActive,
    description:olts.description,
  }).from(olts).where(eq(olts.id,id)).limit(1);

  return row??null;
}

export async function findOltByNameExcludingIdRepository(name:string,id:number){
  const [row]=await db.select({id:olts.id})
    .from(olts)
    .where(and(eq(olts.name,name),ne(olts.id,id)))
    .limit(1);

  return row??null;
}

export async function listOltPonPortsRepository(oltId:number){
  return db.select({
    id:oltPonPorts.id,
    ponNumber:oltPonPorts.ponNumber,
    name:oltPonPorts.name,
    txPowerDbm:oltPonPorts.txPowerDbm,
    description:oltPonPorts.description,
  })
    .from(oltPonPorts)
    .where(eq(oltPonPorts.oltId,oltId))
    .orderBy(asc(oltPonPorts.ponNumber));
}

/* =========================
 * UPDATE
 * ========================= */
export async function updateOltRepository(
  id:number,
  input:{
    name:string;
    brand:string|null;
    model:string|null;
    ponCount:number;
    baseUrl:string;
    username:string;
    passwordEncrypted:string;
    isActive:boolean;
    description:string|null;
  },
){
  const [row]=await db.update(olts)
    .set({...input,updatedAt:new Date()})
    .where(eq(olts.id,id))
    .returning({
      id:olts.id,
      name:olts.name,
      brand:olts.brand,
      model:olts.model,
      ponCount:olts.ponCount,
      isActive:olts.isActive,
    });

  return row??null;
}

/* =========================
 * SAFE PON RESIZE
 * ========================= */
export async function createOltPonPortRangeRepository(
  oltId:number,
  start:number,
  end:number,
){
  if(start>end) return [];

  return db.insert(oltPonPorts)
    .values(Array.from({length:end-start+1},(_,index)=>{
      const ponNumber=start+index;

      return {
        oltId,
        ponNumber,
        name:`PON-${String(ponNumber).padStart(2,"0")}`,
      };
    }))
    .returning({
      id:oltPonPorts.id,
      ponNumber:oltPonPorts.ponNumber,
    });
}

export async function findMappedOltPonPortRepository(portIds:number[]){
  if(portIds.length===0) return null;

  const [row]=await db.select({
    topologyPortId:networkTopologyPorts.id,
    oltPonPortId:networkTopologyPorts.oltPonPortId,
    topologyPortName:networkTopologyPorts.name,
  })
    .from(networkTopologyPorts)
    .where(inArray(networkTopologyPorts.oltPonPortId,portIds))
    .limit(1);

  return row??null;
}

export async function deleteOltPonPortsRepository(portIds:number[]){
  if(portIds.length===0) return [];

  return db.delete(oltPonPorts)
    .where(inArray(oltPonPorts.id,portIds))
    .returning({id:oltPonPorts.id});
}

/* =========================
 * SAFE DELETE
 * ========================= */
export async function findOltTopologyUsageRepository(oltId:number){
  const [nodeRows,portRows]=await Promise.all([
    db.select({id:networkTopologyNodes.id})
      .from(networkTopologyNodes)
      .where(eq(networkTopologyNodes.oltId,oltId))
      .limit(1),

    db.select({id:networkTopologyPorts.id})
      .from(networkTopologyPorts)
      .innerJoin(
        oltPonPorts,
        eq(networkTopologyPorts.oltPonPortId,oltPonPorts.id),
      )
      .where(eq(oltPonPorts.oltId,oltId))
      .limit(1),
  ]);

  return {
    topologyNodeId:nodeRows[0]?.id??null,
    topologyPortId:portRows[0]?.id??null,
  };
}

export async function deactivateOltRepository(id:number){
  const [row]=await db.update(olts)
    .set({isActive:false,updatedAt:new Date()})
    .where(eq(olts.id,id))
    .returning({id:olts.id});

  return row??null;
}

export async function deleteOltRepository(id:number){
  const [row]=await db.delete(olts)
    .where(eq(olts.id,id))
    .returning({id:olts.id});

  return row??null;
}