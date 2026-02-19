import { langConfig } from "@/contexts/LanguageProviderServer";

export const {
    LanguageProvider,
    defaultLanguage,
    appLanguages,
    useTranslation,
    createLanguageResources
} = langConfig({
    defaultLanguage: "en",
    appLanguages: ["en", "es"]
});