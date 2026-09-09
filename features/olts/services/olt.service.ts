import "server-only";

// import {encryptSecret} from "@/lib/security/encryption";
import {
  createOltPonPortsRepository,
  createOltRepository,
  findOltByNameRepository,
  listOltsRepository,
  rollbackCreatedOltRepository,
  createOltPonPortRangeRepository,
  deactivateOltRepository,
  deleteOltPonPortsRepository,
  deleteOltRepository,
  findMappedOltPonPortRepository,
  findOltByNameExcludingIdRepository,
  findOltForEditRepository,
  findOltTopologyUsageRepository,
  listOltPonPortsRepository,
  updateOltRepository,
} from "../repositories/olt.repository";
import {oltListQuerySchema} from "../schemas/olt.schema";
import type {CreateOltInput, UpdateOltInput} from "../schemas/olt.schema";
import type {CreateOltResultDto} from "../types/olt.types";

export class OltDomainError extends Error{}

/* =========================
 * CREATE OLT
 * ========================= */
export async function createOltService(input:CreateOltInput):Promise<CreateOltResultDto>{
  const duplicate=await findOltByNameRepository(input.name);
  if(duplicate) throw new OltDomainError("Nama OLT sudah digunakan");

//   let passwordEncrypted:string;
//   try{
//     passwordEncrypted=encryptSecret(input.password);
//   }catch{
//     throw new OltDomainError("Credential OLT gagal dienkripsi");
//   }

  let olt:CreateOltResultDto;
  try{
    olt=await createOltRepository({
      name:input.name,
      brand:input.brand,
      model:input.model,
      ponCount:input.ponCount,
      baseUrl:input.baseUrl.replace(/\/+$/,""),
      username:input.username,
      passwordEncrypted:input.password,
      isActive:input.isActive,
      description:input.description,
    });
  }catch{
    throw new OltDomainError("Gagal menyimpan data OLT");
  }

  try{
    const ports=await createOltPonPortsRepository(olt.id,input.ponCount);
    if(ports.length!==input.ponCount) throw new Error("PON count mismatch");
  }catch{
    try{
      await rollbackCreatedOltRepository(olt.id);
    }catch{
      throw new OltDomainError("Pembuatan OLT gagal dan rollback tidak selesai. Periksa database.");
    }
    throw new OltDomainError("Gagal membuat PON port OLT");
  }

  return olt;
}

/* =========================
 * LIST OLT
 * ========================= */
export async function listOltsService(input:unknown){
  const query=oltListQuerySchema.parse(input);
  const result=await listOltsRepository(query);
  return {...result,query};
}

export type OltEditDto={
  id:number;
  name:string;
  brand:string|null;
  model:string|null;
  ponCount:number;
  baseUrl:string;
  username:string;
  isActive:boolean;
  description:string|null;
};

export type SafeDeleteOltResult={
  id:number;
  mode:"DELETED"|"DEACTIVATED";
};

/* =========================
 * GET OLT
 * ========================= */
export async function getOltService(id:number):Promise<OltEditDto>{
  const olt=await findOltForEditRepository(id);
  if(!olt) throw new OltDomainError("OLT tidak ditemukan");

  return {
    id:olt.id,
    name:olt.name,
    brand:olt.brand,
    model:olt.model,
    ponCount:olt.ponCount,
    baseUrl:olt.baseUrl,
    username:olt.username,
    isActive:olt.isActive,
    description:olt.description,
  };
}

/* =========================
 * UPDATE + SAFE PON RESIZE
 * ========================= */
export async function updateOltService(input:UpdateOltInput){
  const current=await findOltForEditRepository(input.id);
  if(!current) throw new OltDomainError("OLT tidak ditemukan");

  const duplicate=await findOltByNameExcludingIdRepository(input.name,input.id);
  if(duplicate) throw new OltDomainError("Nama OLT sudah digunakan");

  const ports=await listOltPonPortsRepository(input.id);

  if(ports.length!==current.ponCount){
    throw new OltDomainError(
      `Struktur PON tidak konsisten. OLT=${current.ponCount}, physical port=${ports.length}`,
    );
  }

  const oldCount=current.ponCount;
  const newCount=input.ponCount;

  /* =========================
   * VALIDATE SHRINK
   * ========================= */
  const removablePorts=newCount<oldCount
    ?ports.filter((port)=>port.ponNumber>newCount)
    :[];

  if(removablePorts.length>0){
    const mapped=await findMappedOltPonPortRepository(
      removablePorts.map((port)=>port.id),
    );

    if(mapped){
      const physical=removablePorts.find(
        (port)=>port.id===mapped.oltPonPortId,
      );

      throw new OltDomainError(
        `${physical?.name??"PON"} masih digunakan oleh topology ${mapped.topologyPortName}. Hapus mapping topology terlebih dahulu.`,
      );
    }
  }

  /* =========================
   * PASSWORD
   * ========================= */
  let passwordEncrypted=current.passwordEncrypted;


  const newState={
    name:input.name,
    brand:input.brand,
    model:input.model,
    ponCount:newCount,
    baseUrl:input.baseUrl.replace(/\/+$/,""),
    username:input.username,
    passwordEncrypted,
    isActive:input.isActive,
    description:input.description,
  };

  const oldState={
    name:current.name,
    brand:current.brand,
    model:current.model,
    ponCount:current.ponCount,
    baseUrl:current.baseUrl,
    username:current.username,
    passwordEncrypted:current.passwordEncrypted,
    isActive:current.isActive,
    description:current.description,
  };

  const updated=await updateOltRepository(input.id,newState);
  if(!updated) throw new OltDomainError("Gagal memperbarui OLT");

  try{
    if(newCount>oldCount){
      await createOltPonPortRangeRepository(
        input.id,
        oldCount+1,
        newCount,
      );
    }

    if(newCount<oldCount){
      await deleteOltPonPortsRepository(
        removablePorts.map((port)=>port.id),
      );
    }
  }catch{
    try{
      await updateOltRepository(input.id,oldState);
    }catch{
      throw new OltDomainError(
        "Resize PON gagal dan rollback metadata OLT tidak selesai. Periksa database.",
      );
    }

    throw new OltDomainError("Gagal mengubah jumlah PON OLT");
  }

  return updated;
}

/* =========================
 * SAFE DELETE
 * ========================= */
export async function deleteOltService(id:number):Promise<SafeDeleteOltResult>{
  const olt=await findOltForEditRepository(id);
  if(!olt) throw new OltDomainError("OLT tidak ditemukan");

  const usage=await findOltTopologyUsageRepository(id);

  /*
   * Sudah digunakan topology:
   * jangan hard-delete.
   */
  if(usage.topologyNodeId!==null||usage.topologyPortId!==null){
    const deactivated=await deactivateOltRepository(id);

    if(!deactivated)
      throw new OltDomainError("Gagal menonaktifkan OLT");

    return {
      id,
      mode:"DEACTIVATED",
    };
  }

  /*
   * Belum digunakan topology:
   * aman hard-delete.
   * PON ikut cascade dari olt_pon_ports.
   */
  const deleted=await deleteOltRepository(id);

  if(!deleted)
    throw new OltDomainError("Gagal menghapus OLT");

  return {
    id,
    mode:"DELETED",
  };
}