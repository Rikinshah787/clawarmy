import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * 🛰️ TRACKING_PROTOCOL
 * Manages unique operator count and visitor intelligence.
 */
export async function POST(req: NextRequest) {
    try {
        const { visitorId } = await req.json();

        if (!visitorId) {
            return NextResponse.json({ error: "Visitor ID required" }, { status: 400 });
        }

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                simulated: true,
                message: "SIMULATION_MODE: Tracker heartbeat received but not persisted."
            });
        }

        // 🛡️ Logically: "Hi, I'm here!" (Upsert handles first-time and returning operators)
        // We use onConflict 'visitor_id' to update the visit count
        const { error: upsertError } = await supabase
            .from('users')
            .upsert(
                { visitor_id: visitorId, last_visit: new Date().toISOString() },
                { onConflict: 'visitor_id' }
            );

        if (upsertError) {
            console.error("UPSERT_ERROR:", upsertError);
            // If table doesn't exist, this will fail. We should notify the commander.
            if (upsertError.code === '42P01') {
                return NextResponse.json({
                    error: "DATABASE_MISSING_TABLE: please execute schema.sql in Supabase.",
                    code: '42P01'
                }, { status: 500 });
            }
            throw upsertError;
        }

        // Get total unique count
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            count: count || 0
        });

    } catch (error: any) {
        console.error("TRACKING_ERROR:", error);
        return NextResponse.json({ error: error.message || "Unknown tracking error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({ count: 1 });
        }

        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        return NextResponse.json({ count: count || 0 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
