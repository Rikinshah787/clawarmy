import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import localAgents from "@/data/marketplace.json";

/**
 * 🛰️ AGENT SKILL API
 * Returns the SKILL.md content for a specific agent
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;

        // Find agent in local marketplace
        const agent = localAgents.find(a => a.id === agentId || a.id.startsWith(agentId));

        if (!agent || !agent.skillPath) {
            return NextResponse.json({
                error: "Agent skill not found",
                agentId
            }, { status: 404 });
        }

        // Read the SKILL.md file
        const skillPath = path.join(process.cwd(), agent.skillPath);

        try {
            const skillContent = await fs.readFile(skillPath, 'utf-8');

            return NextResponse.json({
                agentId: agent.id,
                agentName: agent.name,
                skillPath: agent.skillPath,
                content: skillContent,
                format: 'markdown'
            });
        } catch {
            return NextResponse.json({
                error: "Skill file not found",
                path: agent.skillPath
            }, { status: 404 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
