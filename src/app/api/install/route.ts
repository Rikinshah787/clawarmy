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
