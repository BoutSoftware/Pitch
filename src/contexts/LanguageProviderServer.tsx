import { decideSsrLanguage, Language, LanguageResourcesWithDefault } from "./language";
import { LanguageProviderClientBase, useTranslation } from "./LanguageProviderClient";

export default async function LanguageProviderServer({ children, appLanguages, defaultLanguage }: { children: React.ReactNode, appLanguages: Language[], defaultLanguage: Language }) {
    const { cookies, headers } = await import("next/headers");
    const language = decideSsrLanguage(await cookies(), await headers(), appLanguages, defaultLanguage);
    console.log("SSR Language:", language);

    return (
        <LanguageProviderClientBase initialLanguage={language} defaultLanguage={defaultLanguage} appLanguages={appLanguages}>
            {children}
        </LanguageProviderClientBase>
    );
}

export function langConfig<DefaultLanguageType extends Language, AppLanguages extends Language[]>(options: {
    defaultLanguage: DefaultLanguageType;
    appLanguages: AppLanguages;
}) {
    const { defaultLanguage, appLanguages } = options;

    if (!appLanguages.includes(defaultLanguage)) {
        throw new Error("Default language must be included in the app languages.");
    }

    function LanguageProviderServerWrapper({ children }: { children: React.ReactNode }) {
        return (
            <LanguageProviderServer appLanguages={appLanguages} defaultLanguage={defaultLanguage}>
                {children}
            </LanguageProviderServer>
        );
    }

    function useTranslationWrapper<Structure>(languageResources: LanguageResourcesWithDefault<Structure, DefaultLanguageType>) {
        return useTranslation(languageResources, defaultLanguage);
    }

    function createLanguageResources<Structure>(languageResources: LanguageResourcesWithDefault<Structure, DefaultLanguageType>) {
        return languageResources as LanguageResourcesWithDefault<Structure, DefaultLanguageType>;
    }

    return {
        LanguageProvider: LanguageProviderServerWrapper,
        useTranslation: useTranslationWrapper,
        defaultLanguage,
        appLanguages,
        createLanguageResources,
    };
}