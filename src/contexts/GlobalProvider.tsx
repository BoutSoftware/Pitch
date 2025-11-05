import { HeroUIProvider } from "@heroui/system";

export function GlobalProvider({children}: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  )
}