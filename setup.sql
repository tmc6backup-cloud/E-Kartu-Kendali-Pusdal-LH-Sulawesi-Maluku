
-- 1. Tambahkan kolom whatsapp_number jika belum ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='whatsapp_number') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp_number TEXT;
    END IF;
END $$;

-- 2. Memastikan struktur tabel profiles lengkap
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

-- 3. Paksa refresh schema cache (Sangat Penting agar kolom baru terbaca)
NOTIFY pgrst, 'reload schema';
