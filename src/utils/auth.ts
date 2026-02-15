import { SessionData } from "@/configs/auth";
import { headers } from "next/headers";

export function base64ToUint8Array(b64: string) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function getSessionFromHeaders() {
    const requestHeaders = await headers();

    const sessionHeader = requestHeaders.get('x-user-session');

    if (!sessionHeader) {
        throw new Error("No session found in headers");
    }

    return JSON.parse(sessionHeader) as SessionData;
}