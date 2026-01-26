import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { generateRegistrationOptions, RegistrationResponseJSON, verifyRegistrationResponse } from '@simplewebauthn/server';
import { BETTER_AUTH_URL } from '@/config';
import { getSessionFromHeaders } from '@/utils';
import { isoUint8Array } from '@simplewebauthn/server/helpers';

export async function GET(request: NextRequest) {
    try {
        const { user } = await getSessionFromHeaders();

        const existingPasskeys = await prisma.passkey.findMany({
            where: {
                userId: user.id,
            },
            select: {
                credentialID: true,
                transports: true,
            },
        });

        const options = await generateRegistrationOptions({
            rpID: request.nextUrl.hostname,
            rpName: 'Pitch',
            userID: isoUint8Array.fromUTF8String(user.id), // equivalent to Buffer.from(user.id, 'utf8')
            userName: user.email,
            userDisplayName: user.name,
            timeout: 60000,
            attestationType: 'none',
            excludeCredentials: existingPasskeys.map((pk) => ({
                id: pk.credentialID,
                type: 'public-key' as const,
                transports: pk.transports ? pk.transports.split(',') as AuthenticatorTransport[] : undefined,
            })),
            authenticatorSelection: {
                residentKey: 'preferred', // Store credentials on authenticator if possible
                userVerification: 'required', // This means biometrics or PIN is required
                authenticatorAttachment: 'platform', // Prefer built-in authenticators
            },
            extensions: { prf: {} },
        });

        await prisma.challenge.create({
            data: {
                userId: user.id,
                challenge: options.challenge,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
            },
        });

        return NextResponse.json({ data: options, code: "OK", message: 'Challenge generated' });
    } catch (error) {
        console.error('Error generating challenge:', error);
        return NextResponse.json({ code: "INTERNAL_SERVER_ERROR", message: 'Failed to generate challenge' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { user } = await getSessionFromHeaders();

    const { challenge, credential }: { challenge: string; credential: RegistrationResponseJSON } = await req.json();

    console.log("Received credential:", credential);

    const challengeRecord = await prisma.challenge.findUnique({
        where: {
            challenge,
            userId: user.id,
            expiresAt: { gt: new Date() }
        },
        select: { id: true, expiresAt: true }
    });

    if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
        return NextResponse.json({ message: 'Invalid or expired challenge', code: "BAD_CHALLENGE" }, { status: 400 });
    }

    try {
        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: challenge,
            expectedOrigin: BETTER_AUTH_URL || 'http://localhost:3050',
            expectedRPID: req.nextUrl.hostname,
        });

        if (!verification.verified) {
            return NextResponse.json({ code: "VERIFICATION_FAILED", message: 'Verification failed' }, { status: 400 });
        }

        await prisma.challenge.deleteMany({
            where: {
                OR: [
                    { id: challengeRecord.id },
                    { expiresAt: { lt: new Date() } }
                ]
            },
        });

        await prisma.passkey.create({
            data: {
                userId: user.id,
                credentialID: verification.registrationInfo.credential.id,
                publicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString('base64'),
                transports: verification.registrationInfo.credential.transports?.join(',') || null,
                aaguid: verification.registrationInfo!.aaguid,
                deviceType: verification.registrationInfo!.credentialDeviceType,
                backedUp: verification.registrationInfo!.credentialBackedUp,
                counter: verification.registrationInfo!.credential.counter,
                supportsPrf: credential.clientExtensionResults.prf?.enabled || false,
            },
        });

        return NextResponse.json({ code: "OK", message: 'Passkey registered successfully', data: verification });
    } catch (error) {
        console.error('Registration verification error:', error);
        return NextResponse.json({ code: "INTERNAL_SERVER_ERROR", message: 'Failed to verify registration' }, { status: 500 });
    }
}