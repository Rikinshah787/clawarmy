import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { key } = await req.json();
        const commanderKey = process.env.COMMANDER_KEY;

        if (!commanderKey) {
            return NextResponse.json({
                error: "COMMANDER_KEY not configured on server"
            }, { status: 500 });
        }

        if (key === commanderKey) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({
                success: false,
                error: "Invalid Commander Key"
            }, { status: 403 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Auth Failed" }, { status: 500 });
    }
}
