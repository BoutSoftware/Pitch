import { LanguageProvider } from "@/configs/lang";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canary Chat",
  description: "Authenticate to access Canary Chat features.",
  manifest: "/canary/manifest.webmanifest",
  icons: "/canary/logo.svg",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </AuthProvider>
  );
}