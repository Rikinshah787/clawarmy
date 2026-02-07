import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import localAgents from "@/data/marketplace.json";

/**
 * 🛰️ MARKETPLACE API
 * Returns all agents with skills and workflows for public marketplace
 */
export async function GET() {
    try {
        const supabase = getSupabase();

        // Start with local agents (includes skillPath and workflows)
        const enrichedAgents = localAgents.map(agent => ({
            ...agent,
            skillUrl: `/api/agents/${agent.id}/skill`,
            workflowUrl: agent.skillPath?.includes('agents/')
                ? `/api/agents/${agent.id}/workflow`
                : null,
            source: 'local'
        }));

        if (supabase) {
            // Fetch approved agents from Supabase
            const { data: dbAgents, error } = await supabase
                .from('agents')
                .select('id, name, slug, persona, instructions, capabilities, priority, created_at')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (!error && dbAgents) {
                // Add Supabase agents with their skill paths
                const supabaseEnriched = dbAgents.map(agent => ({
                    ...agent,
                    skillUrl: `/api/agents/${agent.slug}/skill`,
                    workflowUrl: null,
                    source: 'supabase'
                }));

                // Combine: local agents first, then Supabase agents
                return NextResponse.json({
                    agents: [...enrichedAgents, ...supabaseEnriched],
                    total: enrichedAgents.length + supabaseEnriched.length
                });
            }
        }

        // Return local agents only if no Supabase
        return NextResponse.json({
            agents: enrichedAgents,
            total: enrichedAgents.length
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
