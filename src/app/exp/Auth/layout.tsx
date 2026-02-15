import { AuthProvider } from '@/contexts/AuthProvider';
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
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}