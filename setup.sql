
-- 1. Pastikan kolom-kolom baru ada di tabel budget_requests
-- Menambahkan kolom assigned_personnel
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='assigned_personnel') THEN
        ALTER TABLE public.budget_requests ADD COLUMN assigned_personnel TEXT;
    END IF;
END $$;

-- Menambahkan kolom dokumen penyelesaian (SPJ)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='report_url') THEN
        ALTER TABLE public.budget_requests ADD COLUMN report_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='sppd_url') THEN
        ALTER TABLE public.budget_requests ADD COLUMN sppd_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='spj_url') THEN
        ALTER TABLE public.budget_requests ADD COLUMN spj_url TEXT;
    END IF;
END $$;

-- Menambahkan kolom realisasi jika belum ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='realization_amount') THEN
        ALTER TABLE public.budget_requests ADD COLUMN realization_amount DECIMAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='realization_date') THEN
        ALTER TABLE public.budget_requests ADD COLUMN realization_date TIMESTAMPTZ;
    END IF;
END $$;

-- Menambahkan kolom catatan jika belum ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='structural_note') THEN
        ALTER TABLE public.budget_requests ADD COLUMN structural_note TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='program_note') THEN
        ALTER TABLE public.budget_requests ADD COLUMN program_note TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='tu_note') THEN
        ALTER TABLE public.budget_requests ADD COLUMN tu_note TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='ppk_note') THEN
        ALTER TABLE public.budget_requests ADD COLUMN ppk_note TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_requests' AND column_name='pic_note') THEN
        ALTER TABLE public.budget_requests ADD COLUMN pic_note TEXT;
    END IF;
END $$;

-- 2. Pastikan kolom whatsapp_number ada di tabel profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='whatsapp_number') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp_number TEXT;
    END IF;
END $$;

-- 3. Paksa refresh cache schema Supabase
NOTIFY pgrst, 'reload schema';
