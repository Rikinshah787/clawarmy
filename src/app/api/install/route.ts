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

        // SECURE: Strict slugification and path validation
        const safeSlug = name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

        // 1. Install Agent Skill
        const agentsDir = path.join(rootDir, "agents");
        const agentFolder = path.resolve(agentsDir, safeSlug);

        // SECURITY CHECK: Ensure it's still inside agentsDir
        if (!agentFolder.startsWith(agentsDir)) {
            return NextResponse.json({ error: "Invalid path target" }, { status: 403 });
        }

        await fs.mkdir(agentFolder, { recursive: true });
        await fs.writeFile(path.join(agentFolder, "SKILL.md"), content, "utf8");

        // 2. Install Slash Command Workflow
        const workflowsDir = path.join(rootDir, ".agent", "workflows");
        const workflowFile = path.resolve(workflowsDir, `${safeSlug}.md`);

        // SECURITY CHECK: Ensure it's still inside workflowsDir
        if (!workflowFile.startsWith(workflowsDir)) {
            return NextResponse.json({ error: "Invalid workflow path" }, { status: 403 });
        }
        await fs.mkdir(workflowsDir, { recursive: true });

        const workflowContent = `---
description: Activates the ${name} specialist
---
1. Read the instructions in \`agents/${safeSlug}/SKILL.md\`.
2. Adopt the persona and wait for user input.
`;
        await fs.writeFile(workflowFile, workflowContent, "utf8");

        return NextResponse.json({
            success: true,
            path: agentFolder,
            message: `Agent ${name} installed! Use /${safeSlug} in chat to activate.`
        });
    } catch (error) {
        console.error("Installation error:", error);
        return NextResponse.json({ error: "Failed to install agent to workspace" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("get");
    const syncAll = searchParams.get("sync") === "all";

    const marketplace = require("@/data/marketplace.json");

    if (syncAll) {
        // Return a script that installs EVERY agent in the marketplace
        let fullScript = `echo "--- ClawArmy Universal Sync Initiative: ACTIVE ---"\n`;
        fullScript += `if (!(Test-Path "agents")) { New-Item -ItemType Directory -Force -Path "agents" }\n`;

        marketplace.forEach((agent: any) => {
            const slugName = agent.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
            fullScript += `
echo "Deploying Agent: ${agent.name}..."
if (!(Test-Path "agents/${slugName}")) { New-Item -ItemType Directory -Force -Path "agents/${slugName}" }
$c_${slugName} = @"
---
name: ${agent.name}
description: ${agent.persona}
---
${agent.instructions}
"@
$c_${slugName} | Out-File -FilePath "agents/${slugName}/SKILL.md" -Encoding utf8
`;
        });

        fullScript += `echo "[SUCCESS] Universal Sync Complete. ${marketplace.length} agents are now operational."\n`;

        return new NextResponse(fullScript, {
            headers: { "Content-Type": "text/plain" }
        });
    }

    if (!agentId) return new NextResponse("Target missing", { status: 400 });

    const agent = marketplace.find((a: any) => a.id === agentId);
    if (!agent) return new NextResponse("Agent not found", { status: 404 });

    const slugName = agent.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

    // Return a powershell script that installs the agent
    const script = `
echo "Initializing ClawArmy Deployment: ${agent.name}..."
if (!(Test-Path "agents")) { New-Item -ItemType Directory -Force -Path "agents" }
if (!(Test-Path "agents/${slugName}")) { New-Item -ItemType Directory -Force -Path "agents/${slugName}" }
$content = @"
---
name: ${agent.name}
description: ${agent.persona}
---
${agent.instructions}
"@
$content | Out-File -FilePath "agents/${slugName}/SKILL.md" -Encoding utf8
echo "[SUCCESS] ${agent.name} is now operational in your workspace."
`;

    return new NextResponse(script, {
        headers: { "Content-Type": "text/plain" }
    });
}
