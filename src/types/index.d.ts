import '@simplewebauthn/server';

declare module '@simplewebauthn/server' {
    interface AuthenticationExtensionsClientInputs {
        prf?: AuthenticationExtensionsPRFInputs;
    }

    interface AuthenticationExtensionsClientOutputs {
        prf?: AuthenticationExtensionsPRFOutputs;
    }
}