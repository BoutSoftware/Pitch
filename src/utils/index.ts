import { SessionData } from "@/config/auth";

export function base64ToUint8Array(b64: string) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export function getSessionFromHeaders(headers: Headers) {
    return JSON.parse(headers.get('x-user-session') || '') as SessionData;
}