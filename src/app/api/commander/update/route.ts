import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

        const { agentId, status } = await req.json();

        if (!agentId || !status) {
            return NextResponse.json({ error: "Missing agentId or status" }, { status: 400 });
        }

        if (!["approved", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return NextResponse.json({
                success: true,
                simulated: true,
                message: "SIMULATION_MODE: Status update logged but not persisted"
            });
        }

        // Update agent status
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === "approved") {
            updateData.approved_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('agents')
            .update(updateData)
            .eq('id', agentId);

        if (error) {
            console.error("Update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Agent ${status === "approved" ? "approved and published" : "rejected"}`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
