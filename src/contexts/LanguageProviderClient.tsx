"use client";

import { deepMerge, Language, LanguageResourcesWithDefault } from "./language";
import { createContext, useContext, useState } from "react";
import React from "react";

// CONTEXT
interface LanguageContextType {
    language: Language | undefined;
    changeLanguage: (language: Language) => void;
}
const LanguageContext = createContext<LanguageContextType>({
    language: undefined,
    changeLanguage: () => { },
});

// LANGUAGE PROVIDER
/**
 * Provides a React context for managing and switching application languages.
 * 
 * This provider component manages the current language state, persists the selected language
 * in localStorage and cookies, and merges language resources for the selected language with the default language.
 * It also exposes a function to change the language and updates the context accordingly.
 *
 * @template Structure - The shape of the language resource object.
 * @template DefaultLanguage - The type representing the default language.
 *
 * @param props.children - The React children nodes to be rendered within the provider.
 * @param props.defaultLanguage - The default language to use if none is selected or stored.
 * @param props.languageResources - An optional object containing language resources keyed by language.
 * @param props.appLanguages - An array of supported languages for the application.
 *
 * @returns A React context provider that supplies the current language, a function to change the language,
 *          and the current language resource to its descendants.
 */
export function LanguageProviderClientBase<DefaultLanguage extends Language>(
    { children, defaultLanguage, appLanguages, initialLanguage }:
        { children: React.ReactNode, defaultLanguage: DefaultLanguage, appLanguages: Language[], initialLanguage?: Language }
) {
    const [language, setLanguage] = useState<Language>(getDefaultLanguage());

    function saveLanguageToStorage(language: Language) {
        localStorage.setItem("language", language);
        document.cookie = `language=${language}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year expiration
    }

    const handleChangeLanguage = React.useCallback((language: Language) => {
        if (!appLanguages.includes(language)) {
            console.error(`Language ${language} is not supported (supported languages: ${appLanguages.join(', ')})`);
        }

        setLanguage(language);
        saveLanguageToStorage(language);
        return;
    }, [appLanguages, defaultLanguage]);


    function getDefaultLanguage() {
        if (typeof window === 'undefined') {
            return initialLanguage || defaultLanguage;
        }

        let language: Language = defaultLanguage;


        const browserLanguage = navigator.language.split("-")[0] as Language;
        if (browserLanguage && appLanguages.includes(browserLanguage)) {
            language = browserLanguage;
        }

        const cookiesLanguage = document.cookie.split("; ").find(row => row.startsWith("language="))?.split("=")[1] as Language | undefined;
        if (cookiesLanguage && appLanguages.includes(cookiesLanguage)) {
            language = cookiesLanguage;
        }

        const storedLanguage = localStorage.getItem("language") as Language | null;
        if (storedLanguage && appLanguages.includes(storedLanguage)) {
            language = storedLanguage;
        }


        if (language !== cookiesLanguage || language !== storedLanguage) {
            saveLanguageToStorage(language);
        }

        return language;
    }

    return (
        <LanguageContext.Provider value={{ language, changeLanguage: handleChangeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
* Custom React hook to access the current language context.
*
* @template Structure - The expected structure of the language context value.
* @returns The current value of the LanguageContext, typed as `LanguageContextType<Structure>`.
*
* @example
* const { language, setLanguage } = useLanguage<MyLanguageStructure>();
*/
export function useLanguage() {
    return useContext(LanguageContext);
}

/**
 * Custom hook to access the current language and its resources.
 * This hook retrieves the current language from the LanguageContext and merges the language resources for that language with the default language's resources to ensure a complete structure.
 * 
 * @param LanguageResources - An object containing language resources for each supported language, with the default language's resources being complete and the others being optional and potentially partial.
 * @returns The merged language resources for the current language, ensuring that all properties from the default language are included even if they are missing in the current language's resources.
 */
export function useTranslation<Structure, DefaultLanguageType extends Language>(
    LanguageResources: LanguageResourcesWithDefault<Structure, DefaultLanguageType>,
    defaultLanguage: DefaultLanguageType
) {
    const { language } = useLanguage();

    if (!language) return LanguageResources[defaultLanguage];

    // Ensure the language's resources are complete by merging with the default language's resources
    const mergedResources = deepMerge(
        LanguageResources[language as keyof typeof LanguageResources],
        LanguageResources[defaultLanguage],
    );

    return mergedResources as typeof LanguageResources[DefaultLanguageType];
}