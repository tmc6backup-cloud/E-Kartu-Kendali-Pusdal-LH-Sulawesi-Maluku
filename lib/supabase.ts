
import { createClient } from '@supabase/supabase-js';

// Ambil kredensial dari environment yang sudah kita set di index.html
const supabaseUrl = (window as any).process.env.SUPABASE_URL;
const supabaseAnonKey = (window as any).process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Test Koneksi
supabase.from('profiles').select('id', { count: 'exact', head: true })
    .then(({ error }) => {
        if (error) console.warn("Supabase Connection Check:", error.message);
        else console.log("Supabase Connection: OK");
    });
