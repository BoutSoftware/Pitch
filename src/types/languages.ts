// export type Language = "en" | "es" | "de" | "it" | "fr" | "ja" | "ko" | "zh";

import { Language } from "@/contexts/language";

export interface LanguageInfo {
    id: Language;
    name: string;
    code: string;
    country: string;
    icon?: string;
}

const LANGUAGES: LanguageInfo[] = [
    {
        id: "en",
        name: "English",
        code: "en",
        country: "US",
        icon: "🇺🇸"
    },
    {
        id: "es",
        name: "Español",
        code: "es",
        country: "MX",
        icon: "🇲🇽"
    },
    {
        id: "de",
        name: "Deutsch",
        code: "de",
        country: "DE",
        icon: "🇩🇪"
    },
    {
        name: "Italiano",
        id: "it",
        code: "it",
        country: "IT",
        icon: "🇮🇹"
    },
    {
        id: "fr",
        name: "Français",
        code: "fr",
        country: "FR",
        icon: "🇫🇷"
    },
    {
        id: "ja",
        name: "日本語",
        code: "ja",
        country: "JP",
        icon: "🇯🇵"
    },
    {
        id: "ko",
        name: "한국어",
        code: "ko",
        country: "KR",
        icon: "🇰🇷"
    },
    {
        id: "zh",
        name: "中文",
        code: "zh",
        country: "CN",
        icon: "🇨🇳"
    }
] as const;

const LANGUAGE_CODES = LANGUAGES.map(lang => lang.id);

const languagesMap = LANGUAGES.reduce((acc, lang) => {
    acc[lang.id] = lang;
    return acc;
}, {} as Record<Language, LanguageInfo>);

const FLUENCY_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const appLanguages: Language[] = ['en', 'es'] as const;
export const defaultLanguage = 'en' as const;


export { LANGUAGES, languagesMap, LANGUAGE_CODES, FLUENCY_LEVELS };