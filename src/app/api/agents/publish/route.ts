import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * 🛰️ AGENT_SUBMISSION_PROTOCOL
 * 
 * Any soldier can submit an agent. It goes into 'pending' status.
 * The Commander reviews and approves/rejects via /commander dashboard.
 */

export async function POST(req: NextRequest) {
    try {
        const agentData = await req.json();
        const { name, persona, instructions, capabilities, priority, submitter_id } = agentData;

        if (!name || !persona || !instructions) {
            return NextResponse.json({ error: "Mission Data Incomplete" }, { status: 400 });
        }

        // Generate URL-safe slug
        const slug = name.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");

        // 🛡️ Get Supabase client on-demand
        const supabase = getSupabase();

        if (!supabase) {
            console.warn(">> SIMULATION_MODE_ACTIVE: Submission logged but not persisted.");
            return NextResponse.json({
                success: true,
                simulated: true,
                message: "SIMULATION_MODE: Your submission was received but not persisted (Supabase not configured)."
            });
        }

        // Check if agent with same slug exists
        const { data: existing } = await supabase
            .from('agents')
            .select('id, name, merge_count, instructions, capabilities')
            .eq('slug', slug)
            .single();

        if (existing) {
            // 🧬 AUTO-MERGE: Reinforce existing agent
            const mergedInstructions = `${existing.instructions}\n\n[REINFORCEMENT_${existing.merge_count + 1}]\n${instructions}`;
            const existingCaps = existing.capabilities || [];
            const newCaps = capabilities || [];
            const mergedCapabilities = Array.from(new Set([...existingCaps, ...newCaps])).slice(0, 15);

            const { error: updateError } = await supabase
                .from('agents')
                .update({
                    instructions: mergedInstructions,
                    capabilities: mergedCapabilities,
                    merge_count: existing.merge_count + 1,
                    updated_at: new Date().toISOString(),
                    status: 'pending'  // Re-queue for review after merge
                })
                .eq('id', existing.id);

            if (updateError) throw updateError;

            return NextResponse.json({
                success: true,
                merged: true,
                message: `🧬 EVOLUTION_QUEUED: Your intel was merged with existing ${existing.name}. Awaiting Commander approval.`
            });
        } else {
            // ⚔️ FRESH SUBMISSION
            const { error: insertError } = await supabase
                .from('agents')
                .insert({
                    name,
                    slug,
                    persona,
                    instructions,
                    capabilities: capabilities || [],
                    priority: priority || 'quality',
                    submitter_id: submitter_id || null,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            return NextResponse.json({
                success: true,
                message: `📡 SUBMISSION_RECEIVED: ${name} is now in the approval queue. Awaiting Commander review.`
            });
        }

    } catch (error: any) {
        console.error("SUBMISSION_ERROR:", error.message);
        return NextResponse.json({ error: "Submission Failed: " + error.message }, { status: 500 });
    }
}
