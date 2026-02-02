
import { createClient } from '@supabase/supabase-js';

// Pastikan kredensial tersedia
const supabaseUrl = process.env.SUPABASE_URL || 'https://syptvhtbxflhjgdepbqs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6HOCKQ1SphXZ9a6fgPDLyA_fuqIVaFR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        headers: { 'x-application-name': 'e-kendali-pusdal-suma-secure' },
    },
});

// Health Check Sederhana
export const checkDatabaseHealth = async () => {
    try {
        const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        if (error) throw error;
        return { online: true };
    } catch (err) {
        console.error("Database Connection Failed:", err);
        return { online: false, error: err };
    }
};
