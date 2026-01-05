export function base64ToUint8Array(b64: string) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}