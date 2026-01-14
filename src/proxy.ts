import { auth } from "@/config/auth";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
    /^\/api\/$/, // Matches only /api/
    /^\/api\/auth\/.*/, // Matches /api/auth/*
    // Match all the routes that are not api, but exclude all under /exp/Auth/* as they need auth
];

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Check if route is public
    const isPublicRoute = publicRoutes.some(route => route.test(pathname));
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Check for authentication token
    const token = getSessionCookie(request);
    if (!token) {
        return NextResponse.json({ message: 'Unauthorized', code: "TOKEN_NOT_FOUND" }, { status: 401 });
    }

    // Validate session using auth.api.getSession
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized", code: "SESSION_NOT_FOUND" }, { status: 401 });
    }

    // Pass the session info to the next api route via headers (x-user-session)
    const newHeaders = new Headers(request.headers);
    newHeaders.set('x-user-session', JSON.stringify(session));

    return NextResponse.next({ headers: newHeaders });
}

export const config = {
    matcher: ['/api/:path*'],
};