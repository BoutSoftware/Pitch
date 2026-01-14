import { NextRequest, NextResponse } from 'next/server';
import { SessionData } from '@/config/auth';
import { prisma } from '@/config/db';
import { generateRegistrationOptions, RegistrationResponseJSON, verifyRegistrationResponse } from '@simplewebauthn/server';
import { BETTER_AUTH_URL } from '@/config';
import { getSessionFromHeaders } from '@/utils';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const { user } = getSessionFromHeaders(await headers());

        const options = await generateRegistrationOptions({
            rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
            rpName: 'Pitch',
            userID: Buffer.from(user.email),
            userName: user.name,
            userDisplayName: user.name,
            timeout: 60000,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
            extensions: { prf: {} },
        });

        console.log('Generated registration options:', options);

        return NextResponse.json({ data: { challenge: options.challenge, options: { ...options, extensions: { prf: {} } } } });
    } catch (error) {
        console.error('Error generating challenge:', error);
        return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { user } = JSON.parse(req.headers.get('x-user-session') || '') as SessionData;

    const { challenge, credential }: { challenge: string; credential: RegistrationResponseJSON } = await req.json();

    const challengeRecord = await prisma.challenge.findUnique({
        where: {
            challenge,
            userId: user.id,
        },
    });

    if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 400 });
    }

    try {
        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: challenge,
            expectedOrigin: BETTER_AUTH_URL || 'http://localhost:3000',
            expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
        });

        if (!verification.verified) {
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }

        await prisma.challenge.delete({
            where: { id: challengeRecord.id },
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
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Registration verification error:', error);
        return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 });
    }
}