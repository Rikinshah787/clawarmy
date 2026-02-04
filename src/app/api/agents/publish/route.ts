import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * 🛰️ GLOBAL_HQ: MISSION_PUBLISHING_PROTOCOL
 * 
 * SQL for Supabase Table:
 * 
 * CREATE TABLE marketplace (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   name TEXT UNIQUE NOT NULL,
 *   persona TEXT NOT NULL,
 *   instructions TEXT NOT NULL,
 *   capabilities TEXT[] NOT NULL,
 *   priority TEXT DEFAULT 'quality',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 */

export async function POST(req: NextRequest) {
    try {
        // 🛡️ COMMANDER_SHIELD_CHECK
        // Only the Commander can authorize global mission deployments
        const authHeader = req.headers.get("x-commander-key");
        const commanderKey = process.env.COMMANDER_KEY;

        if (commanderKey && authHeader !== commanderKey) {
            console.warn(">> UNAUTHORIZED_PUBLISH_ATTEMPT: Access Denied.");
            return NextResponse.json({
                error: "UNAUTHORIZED_SOLDIER: Access Denied. Commander clearance required."
            }, { status: 403 });
        }

        const agentData = await req.json();
        const { name, persona, instructions, capabilities, priority } = agentData;

        if (!name || !persona || !instructions) {
            return NextResponse.json({ error: "Mission Data Incomplete" }, { status: 400 });
        }

        // 🛡️ SECURITY_SHIELD: Simulation Mode if Supabase is offline
        if (!supabase) {
            console.warn(">> SIMULATION_MODE_ACTIVE: Mission intel logged but not persisted (Missing Keys).");
            return NextResponse.json({
                success: true,
                simulated: true,
                message: "SIMULATION_MODE: Intel received but not persisted to Global HQ. Add Supabase keys to enable live deployment."
            });
        }

        // 1. Check if an agent with this designation already exists
        const { data: existingAgent, error: fetchError } = await supabase
            .from('marketplace')
            .select('*')
            .eq('name', name)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Transmission Error:", fetchError);
            return NextResponse.json({ error: "HQ_LINK_STABILITY_FAILURE: Failed to verify mission designation." }, { status: 500 });
        }

        let finalAgent;

        if (existingAgent) {
            // 🧬 1. AUTO-MERGE: PERMUTATION & COMBINATION LOGIC
            console.log(`[MERGE] Desingation ${name} exists. Initiating DNA combination...`);

            const mergedPersona = `HYBRID_EVOLUTION: ${existingAgent.persona} | REINFORCED_WITH: ${persona}`.slice(0, 1000);

            const mergedInstructions = `[BASE_PROTOCOLS]\n${existingAgent.instructions}\n\n[REINFORCEMENT_MODULE]\n${instructions}`;

            const mergedCapabilities = Array.from(new Set([...existingAgent.capabilities, ...capabilities])).slice(0, 15);

            finalAgent = {
                name,
                persona: mergedPersona,
                instructions: mergedInstructions,
                capabilities: mergedCapabilities,
                priority: priority || existingAgent.priority,
                updated_at: new Date().toISOString()
            };

            const { error: upsertError } = await supabase
                .from('marketplace')
                .upsert(finalAgent, { onConflict: 'name' });

            if (upsertError) throw upsertError;

            return NextResponse.json({
                success: true,
                message: `🧬 EVOLUTION_COMPLETE: ${name} has been reinforced with new tactical data.`,
                agent: finalAgent
            });
        } else {
            // ⚔️ 2. FRESH_DEPLOYMENT
            finalAgent = {
                name,
                persona,
                instructions,
                capabilities,
                priority: priority || 'quality'
            };

            const { error: insertError } = await supabase
                .from('marketplace')
                .insert(finalAgent);

            if (insertError) throw insertError;

            return NextResponse.json({
                success: true,
                message: `⚔️ DEPLOYMENT_SUCCESS: ${name} is now part of the Global Army.`,
                agent: finalAgent
            });
        }

    } catch (error: any) {
        console.error("HQ_COMM_CRASH:", error.message);
        return NextResponse.json({ error: "Transmission Interrupted: " + error.message }, { status: 500 });
    }
}
