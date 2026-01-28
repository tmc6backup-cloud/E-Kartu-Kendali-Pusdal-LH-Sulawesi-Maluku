
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables with specific fallbacks
const supabaseUrl = process.env.SUPABASE_URL || 'https://syptvhtbxflhjgdepbqs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6HOCKQ1SphXZ9a6fgPDLyA_fuqIVaFR';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE')) {
    console.error("CRITICAL: Supabase credentials are missing or invalid.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        headers: { 'x-application-name': 'e-kartu-kendali-suma' },
    },
});

// Test Connection Helper (Optional for debugging)
supabase.from('profiles').select('id', { count: 'exact', head: true })
    .then(({ error }) => {
        if (error) console.warn("Supabase Connection Check:", error.message);
        else console.log("Supabase Connection: OK");
    });
