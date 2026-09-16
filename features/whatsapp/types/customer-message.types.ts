/**
 * ============================================
 * CUSTOMER MESSAGE ROW
 * ============================================
 */
export type CustomerMessageRow = {
  id: number;
  name: string;
  phone: string | null;
  whatsappPhone: string | null;
  status: string;
  validWhatsApp: boolean;
};

/**
 * ============================================
 * TOPOLOGY FILTER OPTION
 * ============================================
 */
export type CustomerMessageFilterOption = {
  id: number;
  code: string;
  name: string;
};

/**
 * ============================================
 * PAGE RESULT
 * ============================================
 */
export type CustomerMessagePageResult = {
  data: CustomerMessageRow[];
  page: number;
  pageSize: number | "all";
  total: number;
  totalPages: number;

  filters: {
    olts: CustomerMessageFilterOption[];
    odcs: CustomerMessageFilterOption[];
    odps: CustomerMessageFilterOption[];

    oltId: number | null;
    odcId: number | null;
    odpId: number | null;
  };
};