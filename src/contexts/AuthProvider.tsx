import { auth } from "@/configs/auth";
import { AuthProviderClient } from "@/contexts/AuthProviderClient";
import { headers } from "next/headers";

/**
 * Server Component, used to wrap parts of the app that need authentication protection.
 * Used to get an initial session to avoid flickering on the client side
 * 
 * @param children The children components that will have access to the authentication protection. 
 * @returns 
 */
export async function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <AuthProviderClient initialSession={session}>
      {children}
    </AuthProviderClient>
  );
}