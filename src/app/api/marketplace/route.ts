import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import localAgents from "@/data/marketplace.json";
import fs from "fs/promises";
import path from "path";

/**
 * 🛰️ MARKETPLACE API
 * Returns all agents with skills and workflows for public marketplace
 */
export async function GET() {
    try {
        const rootDir = process.cwd();
        const supabase = getSupabase();

        // Enrich local agents with actual skill/workflow content
        const enrichedLocal = await Promise.all(
            localAgents.map(async (agent: any) => {
                let skillContent = "";
                let workflowContent = "";
                const slugName = agent.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

                // Get skill content
                if (agent.skillPath) {
                    try {
                        skillContent = await fs.readFile(path.join(rootDir, agent.skillPath), 'utf-8');
                    } catch { }
                }

                // Get workflow content
                try {
                    workflowContent = await fs.readFile(path.join(rootDir, '.agent', 'workflows', `${slugName}.md`), 'utf-8');
                } catch { }

                return {
                    ...agent,
                    skillContent: skillContent || null,
                    workflowContent: workflowContent || null,
                    skillUrl: `/api/agents/${agent.id}/skill`,
                    workflowUrl: `/api/agents/${agent.id}/workflow`,
                    source: 'local'
                };
            })
        );

        let allAgents = [...enrichedLocal];

        if (supabase) {
            // Fetch approved agents from Supabase
            const { data: dbAgents, error } = await supabase
                .from('agents')
                .select('id, name, slug, persona, instructions, capabilities, priority, skill_content, workflow_content, created_at')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (!error && dbAgents) {
                const supabaseEnriched = dbAgents.map(agent => ({
                    id: agent.id,
                    name: agent.name,
                    slug: agent.slug,
                    persona: agent.persona,
                    instructions: agent.instructions,
                    capabilities: agent.capabilities,
                    priority: agent.priority,
                    skillContent: agent.skill_content || null,
                    workflowContent: agent.workflow_content || null,
                    skillUrl: `/api/agents/${agent.slug}/skill`,
                    workflowUrl: `/api/agents/${agent.slug}/workflow`,
                    source: 'supabase',
                    created_at: agent.created_at
                }));

                allAgents = [...enrichedLocal, ...supabaseEnriched];
            }
        }

        return NextResponse.json({
            agents: allAgents,
            total: allAgents.length,
            structure: {
                skillContent: "Full SKILL.md content",
                workflowContent: "Full workflow content",
                skillUrl: "API endpoint to fetch skill",
                workflowUrl: "API endpoint to fetch workflow"
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
