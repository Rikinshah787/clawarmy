import { NextResponse } from "next/server";

/**
 * 🔍 DEBUG ENDPOINT: Check if Supabase env vars are present
 * Access at: /api/debug
 */
export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const commander = process.env.COMMANDER_KEY;

    return NextResponse.json({
        supabase_url_present: !!url,
        supabase_key_present: !!key,
        commander_key_present: !!commander,
        url_preview: url ? url.substring(0, 30) + '...' : 'MISSING',
        key_preview: key ? key.substring(0, 10) + '...' : 'MISSING',
        node_env: process.env.NODE_ENV || 'unknown'
    });
}
