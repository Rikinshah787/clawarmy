import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        // Verify Commander Key
        const authHeader = req.headers.get("x-commander-key");
        const commanderKey = process.env.COMMANDER_KEY;

        if (!commanderKey || authHeader !== commanderKey) {
            return NextResponse.json({
                error: "UNAUTHORIZED: Commander access required"
            }, { status: 403 });
        }

        const { agentId } = await req.json();

        if (!agentId) {
            return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
        }

        // Get Supabase client on-demand
        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                simulated: true,
                message: "SIMULATION_MODE: Delete logged but not persisted"
            });
        }

        // Delete the agent
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId);

        if (error) {
            console.error("Delete error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Agent permanently removed from the army"
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
