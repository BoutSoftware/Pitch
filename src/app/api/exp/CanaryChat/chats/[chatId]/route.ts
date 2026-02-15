import { NextResponse } from "next/server";
import prisma from "@/configs/db";
import { getSessionFromHeaders } from "@/utils/auth";

export async function GET(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;
    const { user } = await getSessionFromHeaders();

    const data = await prisma.chat.findUnique({
        where: { id: chatId, userId: user.id },
    });

    return NextResponse.json({ data, code: "OK" }, { status: 200 });
}
