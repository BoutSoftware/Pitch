import { NextResponse } from "next/server";
import prisma from "@/config/db";
import { getSessionFromHeaders } from "@/utils";

export async function GET(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;
    const { user } = await getSessionFromHeaders();

    const data = await prisma.chat.findUnique({
        where: { id: chatId, userId: user.id },
    });

    return NextResponse.json({ data, code: "OK" }, { status: 200 });
}
