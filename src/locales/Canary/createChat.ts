/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLanguageResources } from "@/configs/lang";
import { LanguageResource } from "@/contexts/language";

const englishResources = {
    cardTitle: "Create a new chat",
    createButton: "Create",
    fields: {
        test: "test",
        title: {
            label: "Title",
            placeholder: "Enter chat title",
        },
        scenario: {
            label: "Scenario",
            placeholder: "Select a scenario",
        }
    }
};

export type CreateChatPageTranslation = typeof englishResources;

const spanishResources: LanguageResource<CreateChatPageTranslation> = {
    cardTitle: "Crear un nuevo chat",
    createButton: "Crear",
};

export const createChatPageTranslation = createLanguageResources<CreateChatPageTranslation>({
    "en": englishResources,
    "es": spanishResources,
    "de": {
        cardTitle: "Erstellen Sie einen neuen Chat",
        createButton: "Erstellen",
    }
});

// tests and ramblings:
// const xResources: SpreadLanguageResources<CreateChatPageTranslation, typeof defaultLanguage> = {
//     cardTitle: {
//         "en": "Create a new chat",
//         "es": "Crear un nuevo chat",
//         "de": "Einen neuen Chat erstellen",
//     },
//     createButton: {
//         en: "Create",
//     },
//     fields: {
//         test: {
//             en: "test",
//             es: "prueba",
//         },
//         title: {
//             label: {
//                 "en": "Title",
//                 "es": "Título",
//                 "de": "Titel",
//             },
//             placeholder: {
//                 "en": "Enter chat title",
//                 "es": "Ingrese el título del chat",
//                 "de": "Geben Sie den Chat-Titel ein",
//             }
//         },
//         scenario: {
//             label: {
//                 "en": "Scenario",
//                 "es": "Escenario",
//                 "de": "Szenario",
//             },
//             placeholder: {
//                 "en": "Select a scenario",
//                 "es": "Seleccione un escenario",
//                 "de": "Wählen Sie ein Szenario aus",
//             }
//         }
//     }
// };



// const LR = convertToLanguageResources(xResources, defaultLanguage);
// console.log("LR", JSON.stringify(LR, null, 2));