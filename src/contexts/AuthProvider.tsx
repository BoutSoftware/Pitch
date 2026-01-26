'use client';

import { SessionData } from '@/config/auth';
import { useSession } from '@/config/authClient';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/exp/Auth/login', '/exp/Auth/signup'];

export function AuthProviderClient({ initialSession, children }: { initialSession?: SessionData | null; children: React.ReactNode }) {
    const { data: sessionData, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const session = sessionData ?? (isPending ? initialSession : null);
        if (!session && isPending) {
            return;
        }

        const isPublicRoute = PUBLIC_ROUTES.some((route) =>
            pathname.startsWith(route)
        );

        if (!session && !isPublicRoute) {
            router.push('/exp/Auth/login');
        } else if (session && isPublicRoute) {
            router.push('/exp/Auth/dashboard');
        }
    }, [sessionData?.user.id, initialSession, isPending, router, pathname]);

    return <>{children}</>;
}

