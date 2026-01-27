
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables with specific fallbacks
const supabaseUrl = process.env.SUPABASE_URL || 'https://syptvhtbxflhjgdepbqs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6HOCKQ1SphXZ9a6fgPDLyA_fuqIVaFR';

// Validate credentials before creating the client to avoid confusing fetch errors
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
    console.error("CRITICAL: Supabase URL or Anon Key is missing. Please check your environment variables.");
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
