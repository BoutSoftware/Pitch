import { SessionData } from "@/config/auth";
import { prisma } from "@/config/db";
import { getSessionFromHeaders } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

// GET /api/user/passkeys
export async function GET(request: NextRequest) {
    const session = await getSessionFromHeaders();

    const passkeys = await prisma.passkey.findMany({
        where: {
            userId: session.user.id
        }
    });

    return NextResponse.json({ data: passkeys });
}