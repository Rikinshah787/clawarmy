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

        // Upsert user tracking
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('visitor_id', visitorId)
            .single();

        if (existingUser) {
            await supabase
                .from('users')
                .update({
                    last_visit: new Date().toISOString(),
                    visit_count: (existingUser.visit_count || 1) + 1
                })
                .eq('visitor_id', visitorId);
        } else {
            await supabase
                .from('users')
                .insert({
                    visitor_id: visitorId,
                    visit_count: 1
                });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
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
