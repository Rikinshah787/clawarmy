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

        // SECURE: Strict Identity Guard
        const gitName = process.env.GIT_COMMIT_NAME;
        const gitEmail = process.env.GIT_COMMIT_EMAIL;

        if (!gitEmail) {
            console.error("IDENTITY_GUARD_ALERT: GIT_COMMIT_EMAIL is missing in production.");
            return NextResponse.json({
                error: "Identity Mismatch: Vercel environment variables missing.",
                advice: "Commander, you must set GIT_COMMIT_EMAIL in the Vercel Dashboard for secure synchronization."
            }, { status: 403 });
        }

        const { spawn } = require("child_process");
        const gitCommit = () => new Promise((resolve, reject) => {
            const child = spawn("git", [
                "-c", `user.name=${gitName || "ClawArmy"}`,
                "-c", `user.email=${gitEmail}`,
                "commit", "-m", commitMsg
            ]);
            child.on("close", (code: number | null) => code === 0 || code === 1 ? resolve(null) : reject(new Error("Git commit failed")));
        });
        await gitCommit();

        // 3. Git Push
        const { stdout, stderr } = await execPromise("git push origin main");

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
