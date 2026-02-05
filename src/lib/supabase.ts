import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 🛡️ Create Supabase client on-demand (not at build time)
export function getSupabase(): SupabaseClient | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Support both key names for flexibility
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn(">> SUPABASE_OFFLINE: Missing URL or Key", { url: !!supabaseUrl, key: !!supabaseAnonKey });
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

// Legacy export for compatibility
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const supabase = (url && key) ? createClient(url, key) : null;
