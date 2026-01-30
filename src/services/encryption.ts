export interface StoredCredential {
    id: string;
    rawIdBase64?: string;
    type: string;
    prfSupported: boolean;
}

export interface PRFResults {
    prf: {
        results: {
            first: ArrayBuffer;
        };
    };
}


export const CURRENT_ENCRYPTION_VERSION = 3;
export const versionMap = {
    1: {
        decrypt: decryptV1,
        encrypt: null,
        extractParts: null,
    },
    2: {
        decrypt: decryptV2,
        encrypt: encryptV2,
        extractParts: null,
    },
    3: {
        decrypt: decryptV3,
        encrypt: encryptV3,
        extractParts: extractPartsV3,
    },
};

async function encryptV3(plaintext: string, prfInput: Uint8Array, key: string, credRawId: string): Promise<string> {
    // v3 format: prfInput:rawIdBase64:hkdfSalt:iv:encrypted:3
    const hkdfSalt = new Uint8Array(16);
    window.crypto.getRandomValues(hkdfSalt);

    const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));

    // import key
    const importedKey = await window.crypto.subtle.importKey('raw', Uint8Array.from(atob(key), c => c.charCodeAt(0)), { name: 'HKDF' }, false, ['deriveKey']);

    const aesKey = await window.crypto.subtle.deriveKey(
        { name: 'HKDF', salt: hkdfSalt, info: new TextEncoder().encode('pitch-webauthn-encryption'), hash: 'SHA-256' },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    );

    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);

    const encryptedData = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(plaintext));

    const encoded = [toB64(prfInput), credRawId ? credRawId : '', toB64(hkdfSalt), toB64(iv), toB64(new Uint8Array(encryptedData)), '3'].join(':');
    return encoded;
}

async function decryptV3(dataString: string, key: string): Promise<string> {
    // v3 format: prfInput:rawIdBase64:hkdfSalt:iv:encrypted:3
    const parts = dataString.split(':');
    const [, , hkdfSaltB64, ivB64, encryptedB64] = parts;

    const hkdfSalt = Uint8Array.from(atob(hkdfSaltB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

    const importedKey = await window.crypto.subtle.importKey('raw', Uint8Array.from(atob(key), c => c.charCodeAt(0)), { name: 'HKDF' }, false, ['deriveKey']);
    const aesKey = await window.crypto.subtle.deriveKey(
        { name: 'HKDF', salt: hkdfSalt, info: new TextEncoder().encode('pitch-webauthn-encryption'), hash: 'SHA-256' },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, aesKey, encrypted);
    return new TextDecoder().decode(decryptedBuffer);
}

async function extractPartsV3(dataString: string) {
    // v3 format: prfInput:rawIdBase64:hkdfSalt:iv:encrypted:3
    const parts = dataString.split(':');
    const [prfInputB64, rawIdBase64, hkdfSaltB64, ivB64, encryptedB64] = parts;
    return {
        prfInput: Uint8Array.from(atob(prfInputB64), c => c.charCodeAt(0)),
        rawIdBase64,
        hkdfSalt: Uint8Array.from(atob(hkdfSaltB64), c => c.charCodeAt(0)),
        iv: Uint8Array.from(atob(ivB64), c => c.charCodeAt(0)),
        encrypted: Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0)),
    };
}

async function decryptV1(dataString: string, key: string): Promise<string> {
    // v1 format: prfInput:iv:encrypted:1
    const parts = dataString.split(':');
    const [prfInputB64, ivB64, encryptedB64] = parts;

    const prfInput = Uint8Array.from(atob(prfInputB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

    // import key (turn it into a CryptoKey)
    const importedKey = await window.crypto.subtle.importKey('raw', Uint8Array.from(atob(key), c => c.charCodeAt(0)), { name: 'HKDF' }, false, ['deriveKey']);

    // defrive key, ready for EAS-GCM decryption
    const aesKey = await window.crypto.subtle.deriveKey(
        { name: 'HKDF', salt: new Uint8Array(32), info: new TextEncoder().encode('pitch-webauthn-encryption'), hash: 'SHA-256' },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, aesKey, encrypted);

    return new TextDecoder().decode(decryptedBuffer);
}

async function encryptV2(plaintext: string, prfInput: Uint8Array, key: string): Promise<string> {
    // v2 format: prfInput:hkdfSalt:iv:encrypted:2

    // Generate random HKDF salt
    const hkdfSalt = new Uint8Array(16);
    window.crypto.getRandomValues(hkdfSalt);

    const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));

    // import key (turn it into a CryptoKey)
    const importedKey = await window.crypto.subtle.importKey('raw', Uint8Array.from(atob(key), c => c.charCodeAt(0)), { name: 'HKDF' }, false, ['deriveKey']);

    // derive key, ready for EAS-GCM encryption
    const aesKey = await window.crypto.subtle.deriveKey(
        { name: 'HKDF', salt: hkdfSalt, info: new TextEncoder().encode('pitch-webauthn-encryption'), hash: 'SHA-256' },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    );

    // Generate random IV
    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);

    const encryptedData = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(plaintext));

    const encoded = [toB64(prfInput), toB64(hkdfSalt), toB64(iv), toB64(new Uint8Array(encryptedData)), '2'].join(':');

    return encoded;
}

async function decryptV2(dataString: string, key: string): Promise<string> {
    // v2 format: prfInput:hkdfSalt:iv:encrypted:2
    const parts = dataString.split(':');
    const [prfInputB64, hkdfSaltB64, ivB64, encryptedB64] = parts;

    const prfInput = Uint8Array.from(atob(prfInputB64), c => c.charCodeAt(0));
    const hkdfSalt = Uint8Array.from(atob(hkdfSaltB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

    // import key (turn it into a CryptoKey)
    const importedKey = await window.crypto.subtle.importKey('raw', Uint8Array.from(atob(key), c => c.charCodeAt(0)), { name: 'HKDF' }, false, ['deriveKey']);

    // derive key, ready for EAS-GCM decryption
    const aesKey = await window.crypto.subtle.deriveKey(
        { name: 'HKDF', salt: hkdfSalt, info: new TextEncoder().encode('pitch-webauthn-encryption'), hash: 'SHA-256' },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, aesKey, encrypted);

    return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Encrypts plaintext using WebAuthn PRF and AES-GCM encryption.
 * 
 * @param plaintext The text to be encrypted.
 * @param prfInput The input for the Pseudo-Random Function (PRF).
 * @param key The encryption key in base64 format.
 * @param credRawId The raw ID of the credential.
 * @returns The encrypted text in the specified format.
 */
export async function encrypt(plaintext: string, prfInput: Uint8Array, key: string, credRawId: string): Promise<string> {
    // Use v2 encryption format
    return versionMap[CURRENT_ENCRYPTION_VERSION].encrypt!(plaintext, prfInput, key, credRawId!);
}

export async function decrypt(dataString: string, key: string): Promise<string> {
    const parts = dataString.split(':');

    const version = parseInt(parts[parts.length - 1], 10) as keyof typeof versionMap;

    const decryptFunc = versionMap[version]?.decrypt;
    if (!decryptFunc) {
        throw new Error(`Unsupported encryption version: ${version}`);
    }

    return decryptFunc(dataString, key);
}

export async function extractParts(dataString: string) {
    const dataVersion = await getDataVersion(dataString)
    const versionEntry = versionMap[dataVersion];

    if (!versionEntry || !versionEntry.extractParts) {
        throw new Error(`extractParts not supported for version ${dataVersion}`);
    }

    return versionEntry.extractParts(dataString);
}

export async function getDataVersion(dataString: string) {
    const parts = dataString.split(':');
    const version = parseInt(parts[parts.length - 1], 10);
    return version as keyof typeof versionMap;
}

export async function updateDataVersion(dataString: string, key: string, credRawId: string): Promise<string> {
    const parts = dataString.split(':');

    const version = parseInt(parts[parts.length - 1], 10);

    if (version === CURRENT_ENCRYPTION_VERSION) {
        // already latest version
        return dataString;
    }

    const prfInputB64 = parts[0];
    const prfInput = Uint8Array.from(atob(prfInputB64), c => c.charCodeAt(0));

    const decrypted = await decrypt(dataString, key);
    return encrypt(decrypted, prfInput, key, credRawId);
}

export async function getPrfResult(prfInput: BufferSource, credentials: StoredCredential[], credRawId?: string) {
    if (!window || !navigator.credentials || !navigator.credentials.get) {
        throw new Error('WebAuthn not supported in this environment.');
    }

    const filteredCreds = credentials
        .filter(cred => cred.prfSupported && cred.rawIdBase64 && (!credRawId || cred.rawIdBase64 === credRawId))
        .map(cred => ({
            type: 'public-key',
            id: Uint8Array.from(atob(cred.rawIdBase64!), c => c.charCodeAt(0))
        } as PublicKeyCredentialDescriptor));

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
        publicKey: {
            challenge,
            allowCredentials: filteredCreds,
            userVerification: 'required',
            timeout: 60000,
            extensions: { prf: { eval: { first: prfInput } } },
            // rpId: "localhost",
        },
    }) as PublicKeyCredential | null;

    if (!assertion) {
        throw new Error('Assertion failed.');
    }

    // console log the credential's ID and RawId in base64
    console.log('Credential ID:', assertion.id);
    console.log('Credential RawId (base64):', btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))));

    const clientExt = (assertion as PublicKeyCredential & { getClientExtensionResults?: () => PRFResults }).getClientExtensionResults?.();
    const prfResult = clientExt?.prf?.results?.first as ArrayBuffer | undefined;

    if (!prfResult) {
        throw new Error('PRF extension not supported or failed.');
    }

    return {
        prfKey: new Uint8Array(prfResult),
        assertion: assertion,
    };
}