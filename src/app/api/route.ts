import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma/client";

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    const users = await prisma.user.findMany();

    return NextResponse.json({ message: "API is running", users });
}