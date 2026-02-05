import { NextResponse } from "next/server";

/**
 * 🔍 DEBUG ENDPOINT: Check if Supabase env vars are present
 * Access at: /api/debug
 */
export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key1 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const key2 = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const commander = process.env.COMMANDER_KEY;

    return NextResponse.json({
        supabase_url_present: !!url,
        supabase_anon_key_present: !!key1,
        supabase_publishable_key_present: !!key2,
        commander_key_present: !!commander,
        url_preview: url ? url.substring(0, 30) + '...' : 'MISSING',
        key_used: key1 ? 'ANON_KEY' : key2 ? 'PUBLISHABLE_DEFAULT_KEY' : 'NONE',
        node_env: process.env.NODE_ENV || 'unknown'
    });
}
