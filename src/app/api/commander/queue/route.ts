import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        // Verify Commander Key
        const authHeader = req.headers.get("x-commander-key");
        const commanderKey = process.env.COMMANDER_KEY;

        if (!commanderKey || authHeader !== commanderKey) {
            return NextResponse.json({
                error: "UNAUTHORIZED: Commander access required"
            }, { status: 403 });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return NextResponse.json({
                agents: [],
                simulated: true,
                message: "SIMULATION_MODE: Supabase not configured"
            });
        }

        // Fetch ALL agents (bypasses RLS since we're using service role in production)
        const { data: agents, error } = await supabase
            .from('agents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Queue fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ agents: agents || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
