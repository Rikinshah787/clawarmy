import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * 🛰️ AGENT_SUBMISSION_PROTOCOL
 * 
 * Submit agents with full SKILL.md + Workflow content.
 * Goes into 'pending' status for Commander review.
 */

export async function POST(req: NextRequest) {
    try {
        const agentData = await req.json();
        const {
            name,
            persona,
            instructions,
            capabilities,
            priority,
            submitter_id,
            skillContent,      // Full SKILL.md content
            workflowContent    // Full workflow content
        } = agentData;

        if (!name || !persona) {
            return NextResponse.json({ error: "Mission Data Incomplete: name and persona required" }, { status: 400 });
        }

        // Generate URL-safe slug
        const slug = name.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");

        // Build full skill if not provided
        const fullSkill = skillContent || `---
name: ${name}
description: ${persona}
version: 1.0.0
---

# ${name}

> ${persona}

## Instructions

${instructions || "Follow the agent's specialized protocols."}

## Capabilities

${(capabilities || []).map((c: string) => `- ${c}`).join('\n')}
`;

        // Build workflow if not provided
        const fullWorkflow = workflowContent || `---
description: Activates the ${name} specialist
---
# ${name} Activation

1. Read the instructions in \`agents/${slug}/SKILL.md\`.
2. Adopt the persona and follow all protocols.

## Quick Commands

\`\`\`
# Activate agent
/${slug} "your request"
\`\`\`
`;

        const supabase = getSupabase();

        if (!supabase) {
            console.warn(">> SIMULATION_MODE_ACTIVE: Submission logged but not persisted.");
            return NextResponse.json({
                success: true,
                simulated: true,
                message: "SIMULATION_MODE: Your submission was received but not persisted.",
                preview: { skillContent: fullSkill.substring(0, 200) + "...", workflowContent: fullWorkflow.substring(0, 200) + "..." }
            });
        }

        // Check if agent with same slug exists
        const { data: existing } = await supabase
            .from('agents')
            .select('id, name, merge_count, instructions, capabilities, skill_content')
            .eq('slug', slug)
            .single();

        if (existing) {
            // 🧬 AUTO-MERGE: Combine skills
            const mergedSkill = existing.skill_content
                ? `${existing.skill_content}\n\n---\n## [REINFORCEMENT ${existing.merge_count + 1}]\n${fullSkill}`
                : fullSkill;

            const existingCaps = existing.capabilities || [];
            const newCaps = capabilities || [];
            const mergedCapabilities = Array.from(new Set([...existingCaps, ...newCaps])).slice(0, 15);

            const { error: updateError } = await supabase
                .from('agents')
                .update({
                    instructions: instructions || existing.instructions,
                    capabilities: mergedCapabilities,
                    skill_content: mergedSkill,
                    workflow_content: fullWorkflow,
                    merge_count: existing.merge_count + 1,
                    updated_at: new Date().toISOString(),
                    status: 'pending'
                })
                .eq('id', existing.id);

            if (updateError) throw updateError;

            return NextResponse.json({
                success: true,
                merged: true,
                message: `🧬 EVOLUTION_QUEUED: Merged with existing ${existing.name}. Awaiting Commander approval.`
            });
        } else {
            // ⚔️ FRESH SUBMISSION with full content
            const { error: insertError } = await supabase
                .from('agents')
                .insert({
                    name,
                    slug,
                    persona,
                    instructions: instructions || "",
                    capabilities: capabilities || [],
                    priority: priority || 'quality',
                    submitter_id: submitter_id || null,
                    skill_content: fullSkill,
                    workflow_content: fullWorkflow,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            return NextResponse.json({
                success: true,
                message: `📡 SUBMISSION_RECEIVED: ${name} is now in approval queue with full skill + workflow.`
            });
        }

    } catch (error: any) {
        console.error("SUBMISSION_ERROR:", error);

        let errorMessage = "Submission Failed";
        let statusCode = 500;

        if (error.code === '23505') {
            errorMessage = "An agent with this designation already exists.";
            statusCode = 409;
        } else if (error.code === '23502') {
            errorMessage = "Required fields are missing.";
            statusCode = 400;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // Return the specific error message to help debugging
        return NextResponse.json({
            error: errorMessage,
            code: error.code || "UNKNOWN",
            details: error.details || null,
            hint: error.hint || null
        }, { status: statusCode });
    }
}
