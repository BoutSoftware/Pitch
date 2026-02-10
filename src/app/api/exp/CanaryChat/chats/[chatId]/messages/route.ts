import prisma from "@/config/db";
import { getSessionFromHeaders } from "@/utils";
import { Role } from "@prismaClient";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;
    const { user } = await getSessionFromHeaders();

    const chat = await prisma.chat.findUnique({
        where: { id: chatId, userId: user.id },
    });

    if (!chat) {
        return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ code: "OK", data: messages });
}


export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;
    const { role = Role.USER, text } = await req.json();
    const { user } = await getSessionFromHeaders();

    if (!text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const chat = await prisma.chat.findUnique({
        where: { id: chatId, userId: user.id },
    });

    if (!chat) {
        return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });
    }

    const message = await prisma.message.create({
        data: {
            role,
            text,
            chatId
        },
    });

    return NextResponse.json({ code: "OK", data: message }, { status: 201 });
}
