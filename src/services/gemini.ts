import { ThinkingLevel } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { TranslationPiece } from "@prismaClient";

export const googleGenAI = new GoogleGenAI({});

export async function translateText(text: string, targetLanguage: string): Promise<TranslationPiece[]> {
    const translationResult = await googleGenAI.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: `
                You are a helpful assistant for language learning.

                Given a sentence, break it down into smaller translation pieces that are easier to understand.
                Each translation piece should include the original text and its translation in ${targetLanguage}.
                Each chunk should be the smallest meaningful piece that can be translated on its own. 
                Each translation piece should be a contiguous, ordered part of the original sentence.
                If a piece can be further broken down into smaller meaningful pieces, provide those as well in a recursive manner.

                Always prefer breaking any text into words, unless the words don't make any sense on their own.
                Every translation piece should be broken down further up to the word level.
                Only make a larger piece if it needs to, otherwise, each piece should preferably be a single word. 
                Even between phrases of the full text, break them down instead of making a larger piece.
                If two words can be translated on their own, split them instead of joining them.
                Punctuation should be included in the translation, but as part of the word it is attached to.
                Don't include the original starting text as a piece, the first level should already be its translation pieces.
                Even in the first level, the pieces should be as small as possible, preferably at the word level.
                It seems obvious, but if a piece is in its minimal form, don't try to break it down further.

                TranslationPiece {
                    text: string; // the original text of this piece
                    translation: string; // the translation of this piece
                    translationPieces?: TranslationPiece[]; // optional array of smaller pieces that make up this piece
                }

                Response: 
                TranslationPiece[]
            `,
            temperature: 1.0,
            responseMimeType: "application/json",
            thinkingConfig: {
                thinkingLevel: ThinkingLevel.MINIMAL,
            }
        },
        contents: [
            {
                text: `The text to break down is: "${text}"`,
            }
        ],
    });

    if (!translationResult.text) throw new Error("No response from model");

    try {
        const parsed = JSON.parse(translationResult.text);
        return parsed;
    } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        throw new Error("Failed to parse model response: " + error.toString());
    }
}