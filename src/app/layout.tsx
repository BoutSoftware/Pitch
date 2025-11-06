import type { Metadata } from "next";
import "./globals.css";
import { GlobalProvider } from "@/contexts/GlobalProvider";

export const metadata: Metadata = {
  title: "Pitch",
  description: "An ear training app to help you recognize musical pitches and chords.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}
