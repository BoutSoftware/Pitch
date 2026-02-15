"use client";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider } from "bout-themes";
import { useRouter } from "next/navigation";

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ThemeProvider useSystemTheme={true}>
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  )
}