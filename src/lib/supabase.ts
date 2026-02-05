import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 🛡️ Create Supabase client on-demand (not at build time)
export function getSupabase(): SupabaseClient | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn(">> SUPABASE_OFFLINE: Missing URL or Key");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

// Legacy export for compatibility (will be null if called at build time)
export const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : null;
