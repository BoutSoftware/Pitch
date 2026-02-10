import { NextRequest, NextResponse } from "next/server";
import prisma from "@/config/db";
import { translateText } from "@/services/gemini";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
    const { messageId } = await params;
    const { targetLanguage = "English", translatedText } = await req.json();

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },
    });

    if (!message) {
        return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    if (translatedText) {
        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { translation: translatedText },
        });
        return NextResponse.json({ code: "OK", data: updatedMessage }, { status: 200 });
    }

    if (message.translation) {
        return NextResponse.json({ code: "OK", data: message }, { status: 200 });
    }

    const translatedMessage = await translateText(message.text, targetLanguage);

    const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { translation: translatedMessage as unknown as string },
    });

    return NextResponse.json({ code: "OK", data: updatedMessage }, { status: 200 });
}
