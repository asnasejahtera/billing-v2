export type OltListStatus="all"|"active"|"inactive";
export type OltListSort="name"|"ponCount"|"createdAt";
export type OltListOrder="asc"|"desc";

export type OltListQuery={
  q:string;
  status:OltListStatus;
  sort:OltListSort;
  order:OltListOrder;
  page:number;
  pageSize:number;
};

export type OltListItemDto={
  id:number;
  name:string;
  brand:string|null;
  model:string|null;
  ponCount:number;
  isActive:boolean;
  createdAt:Date;
};

export type OltListResult={
  data:OltListItemDto[];
  page:number;
  pageSize:number;
  total:number;
  totalPages:number;
};

export type CreateOltResultDto={
  id:number;
  name:string;
  brand:string|null;
  model:string|null;
  ponCount:number;
  isActive:boolean;
};