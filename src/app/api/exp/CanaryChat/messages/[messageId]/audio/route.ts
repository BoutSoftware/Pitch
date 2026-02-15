import prisma from "@/configs/db";
import { gcpBucket } from "@/configs/googleCloud";
import { generateTTS } from "@/services/gemini";
import { ApiResponse } from "@/types/api";
import { getFileIdFromFileName, getSignedUrl } from "@/utils/googleCloud";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
    const { messageId } = await params;

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },
    });

    if (!message || !message.audio) {
        return NextResponse.json<ApiResponse>({ code: "NOT_FOUND", message: "Audio not found" }, { status: 404 });
    }

    const audioFileUrl = await getSignedUrl(message.audio);

    return NextResponse.json<ApiResponse>({ code: "OK", message: "Audio URL retrieved", data: { audioUrl: audioFileUrl } }, { status: 200 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
    const { messageId } = await params;

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },
        include: {
            Chat: {
                select: {
                    language: true,
                    scenario: true,
                    level: true,
                },
            },
        },
    });

    if (!message) {
        return NextResponse.json<ApiResponse>({ code: "NOT_FOUND", message: "Message not found or access denied" }, { status: 404 });
    }

    // If the audio file already exists, return the message with the existing audioFileId
    if (message.audio) {
        return NextResponse.json<ApiResponse>({ code: "ALREADY_EXISTS", message: "Audio already exists", data: message }, { status: 200 });
    }

    const audioWavBuffer = await generateTTS(message, message.Chat);

    const audioFileId = getFileIdFromFileName(message.id + ".wav", "messages/audio");
    await gcpBucket.file(audioFileId).save(audioWavBuffer, { contentType: "audio/wav", });

    const audioFileUrl = await getSignedUrl(audioFileId);

    const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { audio: audioFileId },
    });

    updatedMessage.audio = audioFileUrl;

    return NextResponse.json<ApiResponse>({ code: "OK", message: "Audio generated", data: updatedMessage }, { status: 201 });
}
