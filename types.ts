
export type UserRole = 
  | 'pengaju' 
  | 'admin' 
  | 'kpa'
  | 'validator_program' 
  | 'validator_tu' 
  | 'validator_ppk' 
  | 'kepala_bidang' 
  | 'bendahara' 
  | 'pic_verifikator'
  | 'pic_tu' 
  | 'pic_wilayah_1' 
  | 'pic_wilayah_2' 
  | 'pic_wilayah_3';

export interface Profile {
  id: string;
  full_name: string;
  password?: string;
  role: UserRole;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetCeiling {
  id: string;
  department: string;
  ro_code: string;
  komponen_code: string;
  subkomponen_code: string;
  amount: number;
  year: number;
  updated_at?: string;
}

export type BudgetStatus = 'draft' | 'pending' | 'reviewed_bidang' | 'reviewed_program' | 'reviewed_tu' | 'approved' | 'reviewed_pic' | 'rejected';

export interface CalculationItem {
  id: string;
  title: string;
  detail_barang?: string;
  kro_code: string;
  ro_code: string;
  komponen_code: string;
  subkomponen_code: string;
  kode_akun: string;
  f1_val: number;
  f1_unit: string;
  f2_val: number;
  f2_unit: string;
  f3_val: number;
  f3_unit: string;
  f4_val: number;
  f4_unit: string;
  volkeg: number;
  satkeg: string;
  hargaSatuan: number;
  jumlah: number;
}

export interface BudgetRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_department?: string;
  title: string;
  category: string;
  location: string;
  execution_date: string;
  execution_end_date?: string;
  execution_duration?: string;
  amount: number;
  description: string;
  calculation_items?: CalculationItem[];
  status: BudgetStatus;
  ai_analysis?: string;
  attachment_url?: string;
  
  report_url?: string;
  sppd_url?: string;
  spj_url?: string;

  program_note?: string;
  tu_note?: string;
  ppk_note?: string;
  pic_note?: string;
  
  realization_amount?: number;
  realization_date?: string;
  realization_duration?: string;
  realization_note?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}
