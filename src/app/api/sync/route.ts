import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        // 1. Git Add
        await execPromise("git add .");

        // 2. Git Commit
        const commitMsg = message || `Deploying new agents via ClawArmy Command Center [${new Date().toISOString()}]`;
        // Use localized config to avoid identity errors
        await execPromise(`git -c user.name="ClawArmy" -c user.email="contact@agentarmy.io" commit -m "${commitMsg}"`);

        // 3. Git Push
        // We push to 'consolidated' which is the new ClawArmy-code repo
        const { stdout, stderr } = await execPromise("git push consolidated main");

        console.log("Sync stdout:", stdout);
        if (stderr) console.error("Sync stderr:", stderr);

        return NextResponse.json({
            success: true,
            message: "Satellite Sync Complete! Mission data pushed to GitHub."
        });
    } catch (error: any) {
        // If there's nothing to commit, exec will throw an error. 
        // We check for "nothing to commit" to handle it gracefully.
        if (error.message.includes("nothing to commit")) {
            return NextResponse.json({
                success: true,
                message: "Satellite Already Synced. No new mission data to push."
            });
        }

        console.error("Sync error:", error);
        return NextResponse.json({ error: "Failed to sync to satellite: " + error.message }, { status: 500 });
    }
}
