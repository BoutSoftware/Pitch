import { auth } from '@/config/auth';
import { AuthProvider } from '@/contexts/AuthProvider';
import { headers } from 'next/headers';
import React from 'react';

export const metadata = {
  title: 'Auth',
  description: 'Authentication experiments',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSession = await auth.api.getSession({
    headers: await headers()
  });

  return (
    <AuthProvider initialSession={initialSession}>
      {children}
    </AuthProvider>
  );
}