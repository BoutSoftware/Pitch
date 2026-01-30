import { prisma } from "@/config/db";
import { getSessionFromHeaders } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/user/dataStrings/[dataStringId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ dataStringId: string }> }
) {
    const session = await getSessionFromHeaders();
    const { dataStringId } = await params;

    const dataString = await prisma.dataString.findUnique({
        where: {
            id: dataStringId,
        },
    });

    // Check if data string exists
    if (!dataString) {
        return NextResponse.json(
            { code: "NOT_FOUND", message: "Data string not found" },
            { status: 404 }
        );
    }

    // Check if the data string belongs to the user
    if (dataString.userId !== session.user.id) {
        return NextResponse.json(
            { code: "UNAUTHORIZED", message: "Unauthorized" },
            { status: 403 }
        );
    }

    await prisma.dataString.delete({
        where: {
            id: dataStringId,
        },
    });

    return NextResponse.json({ code: "OK", message: "Data string deleted" });
}
