import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/services/gemini";

export async function POST(req: NextRequest) {
    const { text, targetLanguage = "English" } = await req.json();

    const translationResult = await translateText(text, targetLanguage);

    if (!translationResult || translationResult.length === 0) {
        return NextResponse.json({ message: "No translation result from model", code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ code: "OK", data: translationResult }, { status: 200 });
}
