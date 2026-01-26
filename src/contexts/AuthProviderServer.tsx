import { auth } from "@/config/auth";
import { AuthProviderClient } from "@/contexts/AuthProvider";
import { headers } from "next/headers";

export async function AuthProviderServer({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <AuthProviderClient initialSession={session}>
      {children}
    </AuthProviderClient>
  );
}