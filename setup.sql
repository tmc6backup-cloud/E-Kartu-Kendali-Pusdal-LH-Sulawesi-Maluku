
-- 1. Migrasi Kolom WhatsApp (Menjamin kolom ada tanpa menghapus data)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='whatsapp_number') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp_number TEXT;
    END IF;
END $$;

-- 2. Memastikan Tabel Profiles Memiliki Struktur Benar
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- user_nama_lengkap
    full_name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, 
    department TEXT, 
    whatsapp_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Budget Ceilings
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

-- 4. Tabel Budget Requests
CREATE TABLE IF NOT EXISTS public.budget_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT REFERENCES public.profiles(id),
    requester_name TEXT NOT NULL,
    requester_department TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    execution_date DATE,
    execution_end_date DATE,
    execution_duration TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    calculation_items JSONB DEFAULT '[]', 
    status TEXT DEFAULT 'pending', 
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

-- Jalankan ini untuk memicu refresh cache schema di beberapa versi Supabase
NOTIFY pgrst, 'reload schema';
