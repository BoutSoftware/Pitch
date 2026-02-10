import { NextResponse } from "next/server";
import prisma from "@/config/db";
import { getSessionFromHeaders } from "@/utils";

export async function GET() {
    const { user } = await getSessionFromHeaders();

    const chats = await prisma.chat.findMany({
        orderBy: { createdAt: "desc" },
        where: {
            userId: user.id
        }
    });

    return NextResponse.json({ data: chats, code: "OK" }, { status: 200 });
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
