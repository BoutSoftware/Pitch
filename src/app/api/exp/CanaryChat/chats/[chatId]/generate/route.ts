import { NextResponse } from "next/server";
import prisma from "@/configs/db";
import { generateMessage } from "@/services/gemini";

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;

    const chat = await prisma.chat.findUnique({
        include: {
            Messages: {
                orderBy: { createdAt: "asc" },
            },
        },
        where: { id: chatId }
    });

    if (!chat) return NextResponse.json({ message: "Chat not found", code: "NOT_FOUND" }, { status: 404 });

    // Build a simple prompt from recent messages
    const text = await generateMessage(chat);

    if (!text) return NextResponse.json({ message: "No response from model", code: "INTERNAL_SERVER_ERROR" }, { status: 500 });

    const message = await prisma.message.create({ data: { chatId: chatId, role: "MODEL", text } });

    return NextResponse.json({ code: "OK", data: message });
}
