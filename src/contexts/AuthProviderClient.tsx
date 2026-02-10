'use client';

import { SessionData } from '@/config/auth';
import { useSession } from '@/config/authClient';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/exp/Auth/login', '/exp/Auth/signup'];

/**
 * Client Component, used to wrap parts of the app that need authentication protection.
 * It checks the session and redirects to the login page if the user is not authenticated and tries to access a protected route.
 * It also redirects to the dashboard if the user is authenticated and tries to access a public route.
 * 
 * @param initialSession An optional initial session, used on the first load to avoid flickering.
 * @param children The children components that will have access to the authentication protection.
 * @returns 
 */
export function AuthProviderClient({ initialSession, children }: { initialSession?: SessionData | null; children: React.ReactNode }) {
    const { data: sessionData, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const redirect = useSearchParams().get('redirect') || '/exp/Auth/dashboard';

    useEffect(() => {
        const session = sessionData ?? (isPending ? initialSession : null);
        if (!session && isPending) {
            return;
        }

        const isPublicRoute = PUBLIC_ROUTES.some((route) =>
            pathname.startsWith(route)
        );

        if (!session && !isPublicRoute) {
            router.push('/exp/Auth/login?redirect=' + encodeURIComponent(pathname));
        } else if (session && isPublicRoute) {
            router.push(redirect);
        }
    }, [sessionData?.user.id, initialSession, isPending, router, pathname, redirect]);

    return <>{children}</>;
}