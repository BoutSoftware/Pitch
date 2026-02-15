import { NextResponse } from "next/server";
import prisma from "@/configs/db";
import { getSessionFromHeaders } from "@/utils/auth";

export async function GET() {
    const { user } = await getSessionFromHeaders();

    const chats = await prisma.chat.findMany({
        where: {
            userId: user.id
        },
        include: {
            Messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    createdAt: true,
                    text: true,
                }
            }
        }
    });

    const sortedChats = chats.map(chat => ({
        ...chat,
        latestMessage: chat.Messages[0] || null,
        Messages: undefined,
    })).sort((a, b) => {
        const aDate = a.latestMessage ? a.latestMessage.createdAt : a.createdAt;
        const bDate = b.latestMessage ? b.latestMessage.createdAt : b.createdAt;
        return bDate.getTime() - aDate.getTime();
    })

    return NextResponse.json({ data: sortedChats, code: "OK" }, { status: 200 });
}

export async function POST(req: Request) {
    const { title, scenario, language, level } = await req.json();
    const { user } = await getSessionFromHeaders();

    if (!scenario || !language || !level) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const chat = await prisma.chat.create({
        data: {
            title,
            scenario,
            language,
            level,
            User: {
                connect: { id: user.id }
            }
        },
    });

    return NextResponse.json({ data: chat, code: "OK" }, { status: 201 });
}
