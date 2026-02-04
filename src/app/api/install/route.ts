import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const { name, content } = await req.json();

        if (!name || !content) {
            return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
        }

        // Define the base agents directory in the project root
        const rootDir = process.cwd();
        const slug = name.replace(/\s+/g, "-").toLowerCase();

        // 1. Install Agent Skill
        const agentsDir = path.join(rootDir, "agents");
        const agentFolder = path.join(agentsDir, slug);
        await fs.mkdir(agentFolder, { recursive: true });
        await fs.writeFile(path.join(agentFolder, "SKILL.md"), content, "utf8");

        // 2. Install Slash Command Workflow
        const workflowsDir = path.join(rootDir, ".agent", "workflows");
        await fs.mkdir(workflowsDir, { recursive: true });

        const workflowContent = `---
description: Activates the ${name} specialist
---
1. Read the instructions in \`agents/${slug}/SKILL.md\`.
2. Adopt the persona and wait for user input.
`;
        await fs.writeFile(path.join(workflowsDir, `${slug}.md`), workflowContent, "utf8");

        return NextResponse.json({
            success: true,
            path: agentFolder,
            message: `Agent ${name} installed! Use /${slug} in chat to activate.`
        });
    } catch (error) {
        console.error("Installation error:", error);
        return NextResponse.json({ error: "Failed to install agent to workspace" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("get");

    if (!agentId) return new NextResponse("Target missing", { status: 400 });

    // In a real app, you'd fetch from a DB. Here we use marketplace.json
    const agent = require("@/data/marketplace.json").find((a: any) => a.id === agentId);
    if (!agent) return new NextResponse("Agent not found", { status: 404 });

    const slug = agent.name.replace(/\s+/g, "-").toLowerCase();

    // Return a powershell script that installs the agent
    const script = `
echo "Initializing AgentArmy Deployment: ${agent.name}..."
if (!(Test-Path "agents")) { New-Item -ItemType Directory -Force -Path "agents" }
if (!(Test-Path "agents/${slug}")) { New-Item -ItemType Directory -Force -Path "agents/${slug}" }
$content = @"
---
name: ${agent.name}
description: ${agent.persona}
---
${agent.instructions}
"@
$content | Out-File -FilePath "agents/${slug}/SKILL.md" -Encoding utf8
echo "[SUCCESS] ${agent.name} is now operational in your workspace."
`;

    return new NextResponse(script, {
        headers: { "Content-Type": "text/plain" }
    });
}
