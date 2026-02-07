import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import localAgents from "@/data/marketplace.json";

/**
 * 🛰️ AGENT WORKFLOW API
 * Returns the workflow.md content for a specific agent
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;

        // Find agent in local marketplace
        const agent = localAgents.find(a => a.id === agentId || a.id.startsWith(agentId));

        if (!agent) {
            return NextResponse.json({
                error: "Agent not found",
                agentId
            }, { status: 404 });
        }

        // Derive workflow name from agent name
        const workflowName = agent.name.toLowerCase().replace(/\s+/g, '-');
        const workflowPath = path.join(process.cwd(), '.agent', 'workflows', `${workflowName}.md`);

        try {
            const workflowContent = await fs.readFile(workflowPath, 'utf-8');

            return NextResponse.json({
                agentId: agent.id,
                agentName: agent.name,
                workflowPath: `.agent/workflows/${workflowName}.md`,
                content: workflowContent,
                format: 'markdown'
            });
        } catch {
            // Try alternative naming
            const altPath = path.join(process.cwd(), '.agent', 'workflows', `${agent.skillPath?.split('/')[1] || workflowName}.md`);
            try {
                const workflowContent = await fs.readFile(altPath, 'utf-8');
                return NextResponse.json({
                    agentId: agent.id,
                    agentName: agent.name,
                    content: workflowContent,
                    format: 'markdown'
                });
            } catch {
                return NextResponse.json({
                    error: "Workflow not found",
                    agentName: agent.name
                }, { status: 404 });
            }
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
