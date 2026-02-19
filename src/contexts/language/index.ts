// TYPES, ENUMS, AND CONSTANTS
export const defaultLanguagesList = ["en", "es", "de", "it", "fr", "ja", "ko", "zh"] as const;
export type Language = typeof defaultLanguagesList[number];

/**
 * DeepPartial is an utility type that makes all properties of a type optional, recursively.
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * A language resource, which must have a complete structure for every language, and the defaultLanguage is obligatory.
 * The other languages may not appear, but if they do, they must be complete.
 */
type CompleteLanguageResources<Structure, DefaultLanguage extends Language> = {
    [K in DefaultLanguage]: Structure;
} & {
    [K in Exclude<Language, DefaultLanguage>]?: Structure;
};

/**
 * A language resource, which must have a complete structure for the default language, and the other languages are optional and may be partial.
 */
export type LanguageResourcesWithDefault<Structure, DefaultLanguage extends Language> = {
    [K in DefaultLanguage]: Structure;
} & {
    [K in Exclude<Language, DefaultLanguage>]?: DeepPartial<Structure>;
};


export type IncompleteLanguageResources<Structure> = {
    [K in Language]?: DeepPartial<Structure>;
};

export type LanguageResource<Structure> = DeepPartial<Structure>;


export interface LanguageInfo {
    id: Language;
    name: string;
    code: string;
    country: string;
    icon?: string;
}
export const defaultLanguages: LanguageInfo[] = [
    {
        id: "en",
        name: "English",
        code: "en",
        country: "US",
        icon: "🇺🇸",
    },
    {
        id: "es",
        name: "Español",
        code: "es",
        country: "MX",
        icon: "🇲🇽",
    },
    {
        id: "fr",
        name: "Français",
        code: "fr",
        country: "FR",
        icon: "🇫🇷",
    },
    {
        id: "de",
        name: "Deutsch",
        code: "de",
        country: "DE",
        icon: "🇩🇪",
    },
    {
        id: "ja",
        name: "日本語",
        code: "ja",
        country: "JP",
        icon: "🇯🇵",
    },
    {
        id: "ko",
        name: "한국어",
        code: "ko",
        country: "KR",
        icon: "🇰🇷",
    },
    {
        id: "zh",
        name: "中文 (简体)",
        code: "zh-CN",
        country: "CN",
        icon: "🇨🇳",
    },
]
export const defaultLanguagesMap: Record<Language, LanguageInfo> = defaultLanguages.reduce((acc, lang) => {
    acc[lang.id] = lang;
    return acc;
}, {} as Record<Language, LanguageInfo>);


/**
 * Determines the appropriate language to use for server-side rendering (SSR) based on cookies and HTTP headers.
 *
 * This function checks for a language preference in the cookies first. If not found or invalid,
 * it parses the `Accept-Language` header from the request to find a supported language.
 * If a supported language is found in the header, it sets this language in the cookies.
 * If neither source yields a valid language, the default language is returned.
 *
 * @param cookies - An object for getting and setting cookies, typically from the request context.
 * @param headers - The HTTP headers object, used to read the `Accept-Language` header.
 * @param appLanguages - An array of supported language codes for the application.
 * @param defaultLanguage - The fallback language code to use if no valid language is found. Defaults to `'en'`.
 * @returns The determined language code to use for SSR.
 */
export function decideSsrLanguage(
    cookies: { get: (name: string) => { value?: string } | undefined, set: (name: string, value: string, options?: { path?: string, expires?: Date }) => void },
    headers: Headers,
    appLanguages: Language[],
    defaultLanguage: Language = 'en'
): Language {
    console.log('Language Cookie:', cookies.get('language')?.value || 'Not set');
    console.log('Headers Language:', headers.get('Accept-Language') || 'Not set');

    const languageCookie = cookies.get('language')?.value as Language | undefined;
    const languageHeader = headers.get('Accept-Language')?.split(',') as (Language | string)[]; // many languages, with optional quality values

    if (languageCookie && defaultLanguagesMap[languageCookie]) {
        return languageCookie;
    }

    if (languageHeader.length > 0) {
        for (const lang of languageHeader) {
            const langCode = lang.split('-')[0] as Language; // handle cases like 'en-US;q=0.9'
            if (defaultLanguagesMap[langCode]) {
                return langCode;
            }
        }
    }
    return defaultLanguage;
}

/**
 * Merges two objects deeply, where the source object can have partial properties.
 * This function is useful for merging language resources where some languages may not have all properties defined.
 *
 * @param target - The target object to merge into, which will be modified in place.
 * @param source - The source object containing properties to merge into the target.
 * @returns The modified target object after merging.
 */
export function deepMerge<Structure>(target: DeepPartial<Structure>, source: Structure) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) {
                target[key] = {} as DeepPartial<Structure>[typeof key];
            }
            deepMerge(target[key]!, source[key]);
        } else if (source[key] && target[key] === undefined) {
            target[key] = source[key] as DeepPartial<Structure>[typeof key];
        }
    }
    return target;
}

/**
 * Creates a complete set of language resources by merging each language's resources with the default language's structure.
 * This ensures that all languages have a consistent structure, even if some properties are missing in specific languages.
 *
 * @param languageResources - An object containing language resources for each supported language.
 * @param defaultLanguage - The default language code to use as the base structure.
 * @returns A complete set of language resources with all languages having the same structure.
 */
export function createCompleteLanguageResources<Structure, DefaultLanguage extends Language>(
    languageResources: LanguageResourcesWithDefault<Structure, DefaultLanguage>,
    defaultLanguage: DefaultLanguage
) {
    // complete all languages with the default language structure

    const completeResources: Partial<Record<Language, Structure>> = {};

    Object.keys(languageResources).forEach((lang) => {
        const myLang = lang as DefaultLanguage | Exclude<Language, DefaultLanguage>;
        if (myLang === defaultLanguage) {
            completeResources[myLang] = languageResources[defaultLanguage];
        } else {
            completeResources[myLang] = deepMerge(
                languageResources[myLang] as DeepPartial<Structure>,
                languageResources[defaultLanguage] as Structure
            ) as Structure;
        }
    });

    return completeResources as CompleteLanguageResources<Structure, DefaultLanguage>;
}

/**
 * A single list of all translations for a specific key, with the default language being obligatory
 */
export type SpreadLanguageResource<DefaultLanguage extends Language> = {
    [K in DefaultLanguage]: string;
} & {
    [K in Exclude<Language, DefaultLanguage>]?: string;
};

/**
 * A nested structure of translations, where the leaf nodes are either an object, or a SpreadLanguageResource (a single list of all translations for a specific key) 
 * 
 * @example
 * const xResources: SpreadLanguageResources<{
 *   greeting: string;
 *   nested: {
 *     farewell: string;
 *   }
 * }, "en"> = {
 *   greeting: {
 *     en: "Hello",
 *     es: "Hola",
 *   },
 *   nested: {
 *     farewell: {
 *       en: "Goodbye",
 *       es: "Adiós",
 *     }
 *   }
 * }
 */
export type SpreadLanguageResources<Structure, DefaultLanguage extends Language> = {
    [K in keyof Structure]: Structure[K] extends object
    ? SpreadLanguageResources<Structure[K], DefaultLanguage>
    : SpreadLanguageResource<DefaultLanguage>;
};

// function to convert xResources to the format expected by createLanguageResources
export function convertToLanguageResources<Structure, DefaultLanguage extends Language>(resources: SpreadLanguageResources<Structure, DefaultLanguage>, defaultLanguage: DefaultLanguage) {
    const result: IncompleteLanguageResources<Structure> = {};
    for (const key in resources) {
        if (typeof resources[key] === "object") {
            // if its chind keys are all languages, then its a SpreadLanguageResource
            const childKeys = Object.keys(resources[key] as object);
            // const isSpreadLanguageResource = childKeys.every(childKey => defaultLanguagesList.includes(childKey as Language) && typeof (resources[key] as any)[childKey] === "string");
            const childrenKeysAreLanguages = childKeys.every(childKey => defaultLanguagesList.includes(childKey as Language));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const childrenValuesAreStrings = childKeys.every(childKey => typeof (resources[key] as any)[childKey] === "string");

            const isSpreadLanguageResource = childrenKeysAreLanguages && childrenValuesAreStrings;
            if (isSpreadLanguageResource) {
                const spreadResource = resources[key] as SpreadLanguageResource<DefaultLanguage>;

                for (const language in spreadResource) {
                    if (!result[language as Language]) {
                        result[language as Language] = {} as Structure;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (result[language as Language] as any)[key] = spreadResource[language as DefaultLanguage];
                }
            } else if (!childrenKeysAreLanguages && !childrenValuesAreStrings) {
                // there's a nested Object, submit it to the function recursively
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const nestedResult = convertToLanguageResources(resources[key] as SpreadLanguageResources<any, DefaultLanguage>, defaultLanguage);

                for (const language in nestedResult) {
                    if (!result[language as Language]) {
                        result[language as Language] = {} as Structure;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (result[language as Language] as any)[key] = (nestedResult as any)[language as Language];
                }
            }
        }
    }
    return result as LanguageResourcesWithDefault<Structure, DefaultLanguage>;
}

export { langConfig } from "../LanguageProviderServer";