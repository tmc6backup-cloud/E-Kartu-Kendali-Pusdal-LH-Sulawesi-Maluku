
import { createClient } from '@supabase/supabase-js';

// Ambil variabel environment dengan pengecekan objek 'process' yang aman
const getEnv = (key: string) => {
    try {
        return typeof process !== 'undefined' ? process.env[key] : undefined;
    } catch (e) {
        return undefined;
    }
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://syptvhtbxflhjgdepbqs.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'sb_publishable_6HOCKQ1SphXZ9a6fgPDLyA_fuqIVaFR';

// Buat client hanya jika kredensial dasar tersedia, atau gunakan fallback dummy agar aplikasi tidak crash
export const supabase = createClient(
    supabaseUrl, 
    supabaseAnonKey, 
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        global: {
            headers: { 'x-application-name': 'e-kartu-kendali-suma' },
        },
    }
);
