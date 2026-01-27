
-- 1. Tabel Profiles (Manajemen User & Otoritas)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- user_nama_lengkap
    full_name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- pengaju, admin, validator_program, etc
    department TEXT, -- Nama Bidang/Unit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Budget Ceilings (Pagu Anggaran Tahunan)
CREATE TABLE IF NOT EXISTS public.budget_ceilings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT NOT NULL,
    ro_code TEXT NOT NULL,
    komponen_code TEXT,
    subkomponen_code TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department, ro_code, komponen_code, subkomponen_code, year)
);

-- 3. Tabel Budget Requests (Pengajuan Anggaran)
CREATE TABLE IF NOT EXISTS public.budget_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT REFERENCES public.profiles(id),
    requester_name TEXT NOT NULL,
    requester_department TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    execution_date DATE,
    execution_end_date DATE, -- Kolom baru yang ditambahkan
    execution_duration TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    calculation_items JSONB DEFAULT '[]', -- Menyimpan array CalculationItem termasuk detail_barang
    status TEXT DEFAULT 'pending', -- draft, pending, approved, etc
    ai_analysis TEXT,
    attachment_url TEXT,
    report_url TEXT,
    sppd_url TEXT,
    spj_url TEXT,
    program_note TEXT,
    tu_note TEXT,
    ppk_note TEXT,
    pic_note TEXT,
    realization_amount NUMERIC,
    realization_date DATE,
    realization_duration TEXT,
    realization_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.budget_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_dept ON public.budget_requests(requester_department);
CREATE INDEX IF NOT EXISTS idx_ceilings_year ON public.budget_ceilings(year);
