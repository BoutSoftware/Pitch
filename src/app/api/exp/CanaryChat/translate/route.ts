import { NextRequest, NextResponse } from "next/server";
import { generateTextTranslation, generateTranslationPieces } from "@/services/gemini";

export async function POST(req: NextRequest) {
    const { text, targetLanguage = "German", originalLanguage = "English" } = await req.json();

    const translationResult = await generateTextTranslation(text, targetLanguage);

    const translationPiecesResult = await generateTranslationPieces(translationResult, originalLanguage);

    if (!translationResult || translationResult.trim() === "" || !translationPiecesResult || translationPiecesResult.length === 0) {
        return NextResponse.json({ message: "No translation result from model", code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ code: "OK", data: { translation: translationResult, pieces: translationPiecesResult } }, { status: 200 });
}
