import { prisma } from "@/config/db";
import { getSessionFromHeaders } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

// GET /api/user/dataStrings
export async function GET() {
    const session = await getSessionFromHeaders();

    const userDataStrings = await prisma.dataString.findMany({
        where: {
            userId: session.user.id,
        }
    });

    return NextResponse.json({ data: userDataStrings });
}

// POST /api/user/dataStrings
export async function POST(request: NextRequest) {
    const session = await getSessionFromHeaders();
    const body = await request.json();

    const newDataString = await prisma.dataString.create({
        data: {
            userId: session.user.id,
            encryptedData: body.value,
            passkeyId: body.passkeyId
        },
        select: {
            id: true,
        }
    });

    return NextResponse.json({ data: newDataString }, { status: 201 });
}