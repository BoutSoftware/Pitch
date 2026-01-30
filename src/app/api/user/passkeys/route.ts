import { prisma } from "@/config/db";
import { getSessionFromHeaders } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

// GET /api/user/passkeys
export async function GET(request: NextRequest) {
    const session = await getSessionFromHeaders();
    const onlyIds = request.nextUrl.searchParams.get("onlyIds") === "true";
    const prfSupported = request.nextUrl.searchParams.get("prfSupported") === "true";

    const passkeys = await prisma.passkey.findMany({
        where: {
            userId: session.user.id,
            supportsPrf: prfSupported ? true : undefined
        },
        select: onlyIds ? { id: true, credentialID: true } : undefined
    });

    return NextResponse.json({ data: passkeys });
}