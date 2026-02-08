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

        let skillContent = content;
        let workflowContent = "";

        if (agentId) {
            const agent = localAgents.find((a: any) => a.id === agentId);
            if (agent && agent.skillPath) {
                try {
                    const skillPath = path.join(rootDir, agent.skillPath);
                    skillContent = await fs.readFile(skillPath, 'utf-8');
                } catch { }

                const workflowPath = path.join(rootDir, '.agent', 'workflows', `${safeSlug}.md`);
                try {
                    workflowContent = await fs.readFile(workflowPath, 'utf-8');
                } catch { }
            }
        }

        if (!skillContent) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const agentsDir = path.join(rootDir, "agents");
        const agentFolder = path.resolve(agentsDir, safeSlug);

        if (!agentFolder.startsWith(agentsDir)) {
            return NextResponse.json({ error: "Invalid path target" }, { status: 403 });
        }

        await fs.mkdir(agentFolder, { recursive: true });
        await fs.writeFile(path.join(agentFolder, "SKILL.md"), skillContent, "utf8");

        const workflowsDir = path.join(rootDir, ".agent", "workflows");
        const workflowFile = path.resolve(workflowsDir, `${safeSlug}.md`);

        if (!workflowFile.startsWith(workflowsDir)) {
            return NextResponse.json({ error: "Invalid workflow path" }, { status: 403 });
        }
        await fs.mkdir(workflowsDir, { recursive: true });

        const finalWorkflow = workflowContent || `---
description: Activates the ${name} specialist
---
# ${name} Activation

1. Read the instructions in \`agents/${safeSlug}/SKILL.md\`.
2. Adopt the persona and follow all protocols.

## Quick Commands

\`\`\`
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
        return NextResponse.json({ error: "Failed to install agent" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("get");
    const syncAll = searchParams.get("sync") === "all";

    const rootDir = process.cwd();

    if (syncAll) {
        let fullScript = `Write-Host "--- ClawArmy Universal Sync ---" -ForegroundColor Cyan\n`;
        fullScript += `New-Item -ItemType Directory -Force -Path "agents" | Out-Null\n`;
        fullScript += `New-Item -ItemType Directory -Force -Path ".agent/workflows" | Out-Null\n`;

        for (const agent of localAgents as any[]) {
            const slugName = agent.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

            let skillContent = "";
            if (agent.skillPath) {
                try {
                    skillContent = await fs.readFile(path.join(rootDir, agent.skillPath), 'utf-8');
                } catch {
                    skillContent = `---\nname: ${agent.name}\n---\n${agent.instructions || ""}`;
                }
            } else {
                skillContent = `---\nname: ${agent.name}\n---\n${agent.instructions || ""}`;
            }

            // Base64 encode to avoid all escaping issues
            const skillB64 = Buffer.from(skillContent, 'utf-8').toString('base64');

            fullScript += `Write-Host "Installing ${agent.name}..." -ForegroundColor Yellow\n`;
            fullScript += `New-Item -ItemType Directory -Force -Path "agents/${slugName}" | Out-Null\n`;
            fullScript += `[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${skillB64}")) | Out-File -FilePath "agents/${slugName}/SKILL.md" -Encoding utf8\n`;
        }

        fullScript += `Write-Host "[SUCCESS] ${localAgents.length} agents installed!" -ForegroundColor Green\n`;

        return new NextResponse(fullScript, {
            headers: { "Content-Type": "text/plain" }
        });
    }

    if (!agentId) return new NextResponse("Usage: ?get=agent-name or ?sync=all", { status: 400 });

    const searchTerm = agentId.toLowerCase();
    let agent: any = localAgents.find((a: any) =>
        a.id === searchTerm ||
        a.name.toLowerCase() === searchTerm ||
        a.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() === searchTerm
    );

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
                        skillPath: null,
                        skill_content: dbAgent.skill_content,
                        workflow_content: dbAgent.workflow_content
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

    // Get skill content
    let skillContent = "";
    if (agent.skillPath) {
        try {
            skillContent = await fs.readFile(path.join(rootDir, agent.skillPath), 'utf-8');
        } catch {
            skillContent = `---\nname: ${agent.name}\ndescription: ${agent.persona || ""}\n---\n${agent.instructions || ""}`;
        }
    } else if (agent.skill_content) {
        skillContent = agent.skill_content;
    } else {
        skillContent = `---\nname: ${agent.name}\ndescription: ${agent.persona || ""}\n---\n${agent.instructions || ""}`;
    }

    // Get workflow content
    let workflowContent = "";
    try {
        workflowContent = await fs.readFile(path.join(rootDir, '.agent', 'workflows', `${slugName}.md`), 'utf-8');
    } catch {
        if (agent.workflow_content) {
            workflowContent = agent.workflow_content;
        } else {
            workflowContent = `---
description: Activates the ${agent.name} specialist
---
# ${agent.name} Activation

1. Read \`agents/${slugName}/SKILL.md\`
2. Adopt the persona

## Quick Command
\`\`\`
/${slugName} "your request"
\`\`\``;
        }
    }

    // Base64 encode to avoid PowerShell escaping issues
    const skillB64 = Buffer.from(skillContent, 'utf-8').toString('base64');
    const workflowB64 = Buffer.from(workflowContent, 'utf-8').toString('base64');

    const script = `
Write-Host "Initializing ClawArmy Deployment: ${agent.name}..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "agents" | Out-Null
New-Item -ItemType Directory -Force -Path "agents/${slugName}" | Out-Null
New-Item -ItemType Directory -Force -Path ".agent" | Out-Null
New-Item -ItemType Directory -Force -Path ".agent/workflows" | Out-Null
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${skillB64}")) | Out-File -FilePath "agents/${slugName}/SKILL.md" -Encoding utf8
Write-Host "[OK] SKILL.md installed" -ForegroundColor Green
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${workflowB64}")) | Out-File -FilePath ".agent/workflows/${slugName}.md" -Encoding utf8
Write-Host "[OK] Workflow installed" -ForegroundColor Green
Write-Host "[COMPLETE] ${agent.name} is operational! Use /${slugName} to activate." -ForegroundColor Cyan
`;

    return new NextResponse(script, {
        headers: { "Content-Type": "text/plain" }
    });
}
