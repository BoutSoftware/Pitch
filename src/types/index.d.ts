import '@prismaClient';
import '@simplewebauthn/server';

declare module '@simplewebauthn/server' {
    interface AuthenticationExtensionsClientInputs {
        prf?: AuthenticationExtensionsPRFInputs;
    }

    interface AuthenticationExtensionsClientOutputs {
        prf?: AuthenticationExtensionsPRFOutputs;
    }
}

declare module '@prismaClient' {
    interface TranslationPiece {
        text: string; // the original text of this piece
        translation: string; // the translated text of this piece
        translationPieces?: TranslationPiece[]; // Optional nested pieces if this piece was further split for translation
    }

    interface ChatMessage extends Omit<Message, 'translation'> {
        translation?: TranslationPiece[]; // override the translation field to be an array of TranslationPiece
    }

}