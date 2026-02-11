import { GEMINI_API_KEY } from "@/config";
import { ThinkingLevel } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { Chat, ChatMessage, Message, TranslationPiece } from "@prismaClient";

export const googleGenAI = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

enum models {
    GEMINI_F3_P = "gemini-3-flash-preview",
    GEMINI_F25 = "gemini-2.5-flash",
    GEMINI_F25_L = "gemini-2.5-flash-lite",
}

export const GEMINI_MODEL: models = models.GEMINI_F25_L;

export async function generateTranslationPieces(text: string, targetLanguage: string): Promise<TranslationPiece[]> {
    const translationResult = await googleGenAI.models.generateContent({
        model: GEMINI_MODEL,
        config: {
            systemInstruction: `
                You are a helpful assistant for language learning.

                ## TASK DESCRIPTION
                Given a sentence, break it down into smaller translation pieces that are easier to understand.
                Each translation piece should include the original text and its translation in the TARGET LANGUAGE.
                Each chunk should be the smallest meaningful piece that can be translated on its own. 
                Each translation piece should be a contiguous, ordered part of the original sentence.
                If a piece can be further broken down into smaller meaningful pieces, provide those as well in a recursive manner.

                ## HOW TO BREAK DOWN INTO PIECES
                Always prefer breaking any text into words, unless the words don't make sense on their own.
                Every translation piece should be broken down further up to the word level.
                If a piece is already at the word level, it should not have any further translation pieces.
                Only make a larger piece if it needs to, otherwise, each piece should preferably be a single word. 
                Even between phrases/sentences of the full text, break them down instead of having a full sentence as a piece.
                If two words have meaning on their own, split them instead of joining them.
                Only join words into a larger piece if the words don't make much sense on their own or they are a common phrase.
                Don't include the original starting text as a piece, the first level should already be its translation pieces.
                Even in the first level, the pieces should be as small as possible, preferably at the word level.
                It seems obvious, but if a piece is in its minimal form, don't try to break it down further.

                ## PUNCTUATION AND LINE BREAKS
                Punctuation should be included in the text and translation, but as part of the piece it is attached to. Never as its own piece.
                Every line break there exists, must be included. It must be part of the piece next to it.
                Line breaks must be included at the end of the piece's "text" field.
                Every piece must include text, never a single punctuation sign, space nor line break on its own.

                ## DYNAMIC INFORMATION
                Target language to translate to: ${targetLanguage}

                ## TYPES
                TranslationPiece {
                    text: string; // the original text of this piece
                    translation: string; // the translation of this piece
                    translationPieces?: TranslationPiece[]; // optional array of smaller pieces that make up this piece
                }

                ## RESPONSE FORMAT
                Response: 
                TranslationPiece[]
            `,
            temperature: 1.0,
            responseMimeType: "application/json",
            thinkingConfig: GEMINI_MODEL === models.GEMINI_F3_P ? {
                thinkingLevel: ThinkingLevel.MINIMAL,
            } : undefined,
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

export async function generateTextTranslation(text: string, targetLanguage: string): Promise<string> {
    const translationResult = await googleGenAI.models.generateContent({
        model: GEMINI_MODEL,
        config: {
            systemInstruction: `
                You are a helpful assistant for language learning.

                Given a sentence, translate it into ${targetLanguage}.

                Keep its punctuation and line breaks in the translation.

                Response:
                string; // the translation of the original text
            `,
            temperature: 1.0,
            responseMimeType: "text/plain",
            thinkingConfig: GEMINI_MODEL === models.GEMINI_F3_P ? {
                thinkingLevel: ThinkingLevel.MINIMAL,
            } : undefined,
        },
        contents: [
            {
                text: `The text to translate is: "${text}"`,
            }
        ],
    });

    console.log("Translation Text Result:", translationResult.text);

    if (!translationResult.text) throw new Error("No response from model");

    return translationResult.text;
}

export async function generateMessage(chat: Chat & { Messages: Message[] }) {
    const response = await googleGenAI.models.generateContent({
        model: GEMINI_MODEL,
        config: {
            systemInstruction: `
                You are an AI model engaging in a conversation with a user who is learning a language.
                The user and you are role-playing in a specific scenario, and you are playing the part that is not the user.
                The user is the one in the specified scenario, and you are playing the other part in that scenario. 
                You will always respond in the language of the scenario.
                Keep your sentences and vocabulary appropriate for the user's language level.
                Engage in a realistic conversation based on the scenario.
                You will recieve the full conversation history up to this point, and you should use that to inform your response.

                Don't hallucinate, keep in mind the previous chat history and scenario
                Don't forget the user is the one living the scenario, you are the AI Model.

                Generate the next MODEL message in the conversation based on the chat history and scenario.
                The conversation follows, has never stopped, and will continue after your message.

                If the conversation has been going, follow it, dont restart it, dont act as if it was the first message.

                It is also a conversation, not a monologue, so make sure to keep it interactive and engaging, not just a long text.

                Always keep in mind the scenario, language and level of the user, and make sure to adapt your responses to those.

                User Scenario: ${chat.scenario}
                User Language Level: ${chat.level}
                Conversation Language: ${chat.language}
            `,
            temperature: 1.5,
            responseMimeType: "text/plain",
            thinkingConfig: GEMINI_MODEL === models.GEMINI_F3_P ? {
                thinkingLevel: ThinkingLevel.MINIMAL,
            } : undefined,
        },
        contents: chat.Messages.map(m => ({
            role: m.role === "USER" ? "user" : "model",
            text: m.text,
        }))
    });

    if (!response.text) throw new Error("No response from model");

    return response.text;
}