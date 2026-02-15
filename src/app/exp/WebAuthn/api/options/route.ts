import { NextRequest, NextResponse } from "next/server";

/**
 * POST /exp/webauthn/api/options
 * Handles WebAuthn options, initial step for registration and authentication.
 * 
 * @param req 
 * @returns 
 */
export async function POST(_req: NextRequest) {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const _options = {
        challenge: challenge,
        rp: {
            name: "Pitch",
        },
        user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
        },
    };

    return NextResponse.json({
        challenge: Buffer.from(challenge).toString('base64url'),
    });
}