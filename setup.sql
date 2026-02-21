
-- Tabel untuk menyimpan token push notification PWA (VAPID)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk efisiensi pengiriman notifikasi massal per user
CREATE INDEX IF NOT EXISTS idx_push_user ON public.push_subscriptions(user_id);

-- Aktifkan RLS agar user hanya bisa mengelola token miliknya sendiri
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions" 
    ON public.push_subscriptions 
    FOR ALL 
    USING (user_id = auth.uid()::text) 
    WITH CHECK (user_id = auth.uid()::text);

-- Force refresh cache schema
ALTER TABLE IF EXISTS public.budget_requests ADD COLUMN IF NOT EXISTS structural_validator_name TEXT;
ALTER TABLE IF EXISTS public.budget_requests ADD COLUMN IF NOT EXISTS program_validator_name TEXT;
ALTER TABLE IF EXISTS public.budget_requests ADD COLUMN IF NOT EXISTS tu_validator_name TEXT;
ALTER TABLE IF EXISTS public.budget_requests ADD COLUMN IF NOT EXISTS ppk_validator_name TEXT;
ALTER TABLE IF EXISTS public.budget_requests ADD COLUMN IF NOT EXISTS pic_validator_name TEXT;
ALTER TABLE IF EXISTS public.budget_requests ADD COLUMN IF NOT EXISTS realization_validator_name TEXT;

NOTIFY pgrst, 'reload schema';
