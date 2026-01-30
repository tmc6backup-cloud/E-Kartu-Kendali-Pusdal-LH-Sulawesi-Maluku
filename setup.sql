
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

-- 3. Tabel Pengajuan Anggaran (Dengan Foreign Key ke Profiles)
CREATE TABLE IF NOT EXISTS public.budget_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT REFERENCES public.profiles(id),
    requester_name TEXT NOT NULL,
    requester_department TEXT,
    title TEXT NOT NULL,
    category TEXT,
    location TEXT,
    execution_date DATE,
    execution_end_date DATE,
    execution_duration TEXT,
    amount DECIMAL DEFAULT 0,
    description TEXT,
    calculation_items JSONB,
    status TEXT DEFAULT 'pending',
    ai_analysis TEXT,
    attachment_url TEXT,
    program_note TEXT,
    tu_note TEXT,
    ppk_note TEXT,
    pic_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Aktifkan RLS (Row Level Security) jika diperlukan, atau pastikan anon access aktif di dashboard Supabase.
-- Pastikan kolom whatsapp_number ada di profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='whatsapp_number') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp_number TEXT;
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
