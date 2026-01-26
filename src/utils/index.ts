import { SessionData } from "@/config/auth";
import { headers } from "next/headers";

export function base64ToUint8Array(b64: string) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function getSessionFromHeaders() {
    const requestHeaders = await headers();
    return JSON.parse(requestHeaders.get('x-user-session') || '') as SessionData;
}