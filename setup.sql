
-- 1. Tabel Profil (User)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, 
    department TEXT, 
    whatsapp_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Pagu Anggaran
CREATE TABLE IF NOT EXISTS public.budget_ceilings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT NOT NULL,
    ro_code TEXT NOT NULL,
    komponen_code TEXT,
    subkomponen_code TEXT,
    amount DECIMAL NOT NULL,
    year INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department, ro_code, komponen_code, subkomponen_code, year)
);

-- 3. Tabel Pengajuan Anggaran (Sudah Diperbarui)
CREATE TABLE IF NOT EXISTS public.budget_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT REFERENCES public.profiles(id),
    requester_name TEXT NOT NULL,
    requester_department TEXT,
    title TEXT NOT NULL,
    category TEXT,
    location TEXT,
    assigned_personnel TEXT, -- Kolom baru untuk personil yang ditugaskan
    execution_date DATE,
    execution_end_date DATE,
    execution_duration TEXT,
    amount DECIMAL DEFAULT 0,
    description TEXT,
    calculation_items JSONB,
    status TEXT DEFAULT 'pending',
    ai_analysis TEXT,
    attachment_url TEXT, -- File usulan awal (KAK/RAB)
    
    -- Kolom untuk dokumen penyelesaian (SPJ)
    report_url TEXT,
    sppd_url TEXT,
    spj_url TEXT,

    -- Kolom untuk catatan validator
    structural_note TEXT,
    program_note TEXT,
    tu_note TEXT,
    ppk_note TEXT,
    pic_note TEXT,
    
    -- Kolom realisasi
    realization_amount DECIMAL,
    realization_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- KEAMANAN: AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_ceilings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_requests ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk Tabel Profiles
DROP POLICY IF EXISTS "Profiles can be viewed by all authenticated users" ON public.profiles;
CREATE POLICY "Profiles can be viewed by all authenticated users" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL USING (true);

-- Kebijakan untuk Tabel Budget Ceilings
DROP POLICY IF EXISTS "All users can view ceilings" ON public.budget_ceilings;
CREATE POLICY "All users can view ceilings" 
ON public.budget_ceilings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage ceilings" ON public.budget_ceilings;
CREATE POLICY "Only admins can manage ceilings" 
ON public.budget_ceilings FOR ALL USING (true);

-- Kebijakan untuk Tabel Budget Requests
DROP POLICY IF EXISTS "Users can view their own requests" ON public.budget_requests;
CREATE POLICY "Users can view their own requests" 
ON public.budget_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own requests" ON public.budget_requests;
CREATE POLICY "Users can create their own requests" 
ON public.budget_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own requests" ON public.budget_requests;
CREATE POLICY "Users can update their own requests" 
ON public.budget_requests FOR UPDATE USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
