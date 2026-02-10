import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/config/db";

const ai = new GoogleGenAI({});

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;

    const chat = await prisma.chat.findUnique({
        include: { Messages: true },
        where: { id: chatId }
    });

    if (!chat) return NextResponse.json({ message: "Chat not found", code: "NOT_FOUND" }, { status: 404 });

    // Build a simple prompt from recent messages
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: `
                You will support the role play in the scenario "${chat.scenario}" speaking in ${chat.language}. 
                The user is the one in the scenario, and you are helping play the other part. 
                Answer as naturally as possible in ${chat.language}.
                The user's language level is ${chat.level}, so keep your sentences and vocabulary appropriate for that level. 
                Engage in a realistic conversation based on the scenario.
            `,
            temperature: 1.5,
        },
        contents: chat.Messages.map(m => ({
            role: m.role === "USER" ? "user" : "model",
            text: m.text,
        }))
    });

    const text = response?.text ?? "";

    if (!text) return NextResponse.json({ message: "No response from model", code: "INTERNAL_SERVER_ERROR" }, { status: 500 });

    const message = await prisma.message.create({ data: { chatId: chatId, role: "MODEL", text } });

    return NextResponse.json({ code: "OK", data: message });
}
