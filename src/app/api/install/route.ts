import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import localAgents from "@/data/marketplace.json";

export async function POST(req: NextRequest) {
    try {
        const { name, content, agentId } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const rootDir = process.cwd();
        const safeSlug = name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

        // Try to get real skill content
        let skillContent = content;
        let workflowContent = "";

        // If agentId provided, fetch real skill from local agents
        if (agentId) {
            const agent = localAgents.find((a: any) => a.id === agentId);
            if (agent && agent.skillPath) {
                try {
                    const skillPath = path.join(rootDir, agent.skillPath);
                    skillContent = await fs.readFile(skillPath, 'utf-8');
                } catch {
                    // Fall back to provided content
                }

                // Try to get workflow
                const workflowPath = path.join(rootDir, '.agent', 'workflows', `${safeSlug}.md`);
                try {
                    workflowContent = await fs.readFile(workflowPath, 'utf-8');
                } catch {
                    // Generate default workflow
                }
            }
        }

        if (!skillContent) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // 1. Install Agent Skill
        const agentsDir = path.join(rootDir, "agents");
        const agentFolder = path.resolve(agentsDir, safeSlug);

        if (!agentFolder.startsWith(agentsDir)) {
            return NextResponse.json({ error: "Invalid path target" }, { status: 403 });
        }

        await fs.mkdir(agentFolder, { recursive: true });
        await fs.writeFile(path.join(agentFolder, "SKILL.md"), skillContent, "utf8");

        // 2. Install Workflow
        const workflowsDir = path.join(rootDir, ".agent", "workflows");
        const workflowFile = path.resolve(workflowsDir, `${safeSlug}.md`);

        if (!workflowFile.startsWith(workflowsDir)) {
            return NextResponse.json({ error: "Invalid workflow path" }, { status: 403 });
        }
        await fs.mkdir(workflowsDir, { recursive: true });

        const finalWorkflow = workflowContent || `---
description: Activates the ${name} specialist
---
# 👤 ${name} Activation

1. Read the instructions in \`agents/${safeSlug}/SKILL.md\`.
2. Adopt the persona and follow all protocols.

## Quick Commands

\`\`\`
# Activate agent
/${safeSlug} "your request"
\`\`\`
`;
        await fs.writeFile(workflowFile, finalWorkflow, "utf8");

        return NextResponse.json({
            success: true,
            path: agentFolder,
            hasRealSkill: !!agentId,
            hasWorkflow: !!workflowContent,
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

    const rootDir = process.cwd();

    if (syncAll) {
        // Return script that installs ALL agents with REAL skills
        let fullScript = `echo "--- ClawArmy Universal Sync: Installing ALL Agents with Full Skills ---"\n`;
        fullScript += `if (!(Test-Path "agents")) { New-Item -ItemType Directory -Force -Path "agents" }\n`;
        fullScript += `if (!(Test-Path ".agent/workflows")) { New-Item -ItemType Directory -Force -Path ".agent/workflows" }\n`;

        for (const agent of localAgents as any[]) {
            const slugName = agent.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

            // Read real skill content
            let skillContent = "";
            if (agent.skillPath) {
                try {
                    const skillPath = path.join(rootDir, agent.skillPath);
                    skillContent = await fs.readFile(skillPath, 'utf-8');
                } catch {
                    skillContent = `---\nname: ${agent.name}\ndescription: ${agent.persona}\n---\n${agent.instructions}`;
                }
            } else {
                skillContent = `---\nname: ${agent.name}\ndescription: ${agent.persona}\n---\n${agent.instructions}`;
            }

            // Escape for PowerShell
            const safeContent = skillContent
                .replace(/\$/g, '`$')
                .replace(/"/g, '`"')
                .replace(/\r\n/g, '\n');

            fullScript += `
echo "Deploying Agent: ${agent.name}..."
if (!(Test-Path "agents/${slugName}")) { New-Item -ItemType Directory -Force -Path "agents/${slugName}" }
@"
${safeContent}
"@ | Out-File -FilePath "agents/${slugName}/SKILL.md" -Encoding utf8
`;
        }

        fullScript += `echo "[SUCCESS] Sync Complete. ${localAgents.length} agents with full skills installed."\n`;

        return new NextResponse(fullScript, {
            headers: { "Content-Type": "text/plain" }
        });
    }

    if (!agentId) return new NextResponse("Usage: ?get=agent-name or ?sync=all", { status: 400 });

    // Find agent
    const searchTerm = agentId.toLowerCase();
    let agent: any = localAgents.find((a: any) =>
        a.id === searchTerm ||
        a.name.toLowerCase() === searchTerm ||
        a.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() === searchTerm
    );

    // Check Supabase if not found locally
    if (!agent) {
        try {
            const { getSupabase } = await import("@/lib/supabase");
            const supabase = getSupabase();

            if (supabase) {
                const { data: dbAgent } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('status', 'approved')
                    .or(`slug.eq.${searchTerm},name.ilike.${searchTerm}`)
                    .single();

                if (dbAgent) {
                    agent = {
                        id: dbAgent.slug,
                        name: dbAgent.name,
                        persona: dbAgent.persona,
                        instructions: dbAgent.instructions,
                        capabilities: dbAgent.capabilities
                    };
                }
            }
        } catch (e) {
            console.warn("DB lookup failed");
        }
    }

    if (!agent) {
        return new NextResponse(`Agent "${agentId}" not found.`, { status: 404 });
    }

    const slugName = agent.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

    // Get REAL skill content
    let skillContent = "";
    if (agent.skillPath) {
        try {
            const skillPath = path.join(rootDir, agent.skillPath);
            skillContent = await fs.readFile(skillPath, 'utf-8');
        } catch {
            skillContent = `---\nname: ${agent.name}\ndescription: ${agent.persona || ""}\n---\n${agent.instructions || ""}`;
        }
    } else {
        skillContent = `---\nname: ${agent.name}\ndescription: ${agent.persona || ""}\n---\n${agent.instructions || ""}`;
    }

    // Get workflow content
    let workflowContent = "";
    try {
        const workflowPath = path.join(rootDir, '.agent', 'workflows', `${slugName}.md`);
        workflowContent = await fs.readFile(workflowPath, 'utf-8');
    } catch {
        // Generate default workflow
        workflowContent = `---
description: Activates the ${agent.name} specialist
---
# ${agent.name} Activation

1. Read the instructions in \`agents/${slugName}/SKILL.md\`.
2. Adopt the persona and follow all protocols.

## Quick Commands

\`\`\`
# Activate agent
/${slugName} "your request"
\`\`\``;
    }

    // Escape for PowerShell
    const safeContent = skillContent
        .replace(/\$/g, '`$')
        .replace(/"/g, '`"')
        .replace(/\r\n/g, '\n');

    const safeWorkflow = workflowContent
        .replace(/\$/g, '`$')
        .replace(/"/g, '`"')
        .replace(/\r\n/g, '\n');

    const script = `
echo "Initializing ClawArmy Deployment: ${agent.name}..."
if (!(Test-Path "agents")) { New-Item -ItemType Directory -Force -Path "agents" }
if (!(Test-Path "agents/${slugName}")) { New-Item -ItemType Directory -Force -Path "agents/${slugName}" }
if (!(Test-Path ".agent")) { New-Item -ItemType Directory -Force -Path ".agent" }
if (!(Test-Path ".agent/workflows")) { New-Item -ItemType Directory -Force -Path ".agent/workflows" }
@"
${safeContent}
"@ | Out-File -FilePath "agents/${slugName}/SKILL.md" -Encoding utf8
echo "[SUCCESS] SKILL.md installed."
@"
${safeWorkflow}
"@ | Out-File -FilePath ".agent/workflows/${slugName}.md" -Encoding utf8
echo "[SUCCESS] Workflow installed. Use /${slugName} to activate."
echo "[COMPLETE] ${agent.name} is now operational!"
`;

    return new NextResponse(script, {
        headers: { "Content-Type": "text/plain" }
    });
}

