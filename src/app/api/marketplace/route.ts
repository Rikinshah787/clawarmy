import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * 🛰️ MARKETPLACE API
 * Returns all APPROVED agents for public marketplace
 */
export async function GET() {
    try {
        const supabase = getSupabase();

        if (!supabase) {
            // Return empty array in simulation mode
            return NextResponse.json({ agents: [], simulated: true });
        }

        // Fetch only approved agents
        const { data: agents, error } = await supabase
            .from('agents')
            .select('id, name, slug, persona, instructions, capabilities, priority, created_at')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Marketplace fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ agents: agents || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
