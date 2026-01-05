"use client"

import { Button } from '@heroui/button'
import { Spinner } from '@heroui/spinner'
import React, { useEffect } from 'react'

type StoredCredential = {
  id: string
  type: string
  rawIdBase64?: string
  prfSupported?: boolean
}

interface PRFResults {
  prf?: {
    results?: {
      first?: ArrayBuffer
      second?: ArrayBuffer
    }
  }
  [key: string]: unknown
}

interface User {
  id: string
  name: string
  displayName: string
  credentials?: StoredCredential[]
  data: string[]
}

export default function WebAuthnExp() {
  const [user, setUser] = React.useState<User>()
  const [dataToEncrypt, setDataToEncrypt] = React.useState<string>('')
  const [decryptedData, setDecryptedData] = React.useState<string[]>([])

  const saveUserToStorage = () => {
    if (!user) return

    setUser((prevUser) => {
      if (!prevUser) return prevUser
      localStorage.setItem('webauthn-user', JSON.stringify(prevUser))
      console.log('User saved to localStorage')
      return prevUser
    })
  }

  const createWebAuthnCredential = async () => {
    if (!user) return

    console.log('Creating WebAuthn Credential...')

    // Simulate server-provided webauthn information and challenge
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)
    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: { name: 'Pitch' },
      user: {
        id: new TextEncoder().encode(user.id || 'unknown'),
        name: user.name || 'unknown',
        displayName: user.displayName || 'Unknown User',
      },
      // Include both ES256 and RS256 to satisfy platform authenticator expectations
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        // Do not force `authenticatorAttachment` so the browser can select the best authenticator.
        userVerification: 'preferred', // prefer but don't mandate (improves compatibility)
        residentKey: 'discouraged', // avoid requiring discoverable/resident credentials
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none', // avoid attestation prompts which some platform authenticators block
      extensions: {
        prf: {
          eval: {
            first: new Uint8Array(32),
          },
        },
      },
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey,
      }) as PublicKeyCredential | null

      if (!credential) {
        console.error('Credential creation was not successful.')
        return
      }

      console.log('Credential created:', credential)

      const prfSupported = credential.getClientExtensionResults().prf?.enabled

      if (prfSupported) {
        console.log('PRF extension is supported by the authenticator.')
      } else {
        console.warn('PRF extension is NOT supported by the authenticator.')
      }

      // Store rawId as base64 so we can reconstruct the original ArrayBuffer later
      const rawIdArray = new Uint8Array(credential.rawId as ArrayBuffer)
      const rawIdBase64 = btoa(String.fromCharCode(...rawIdArray))

      const newCredential: StoredCredential = {
        id: credential.id,
        type: credential.type,
        rawIdBase64,
        prfSupported: !!prfSupported,
      }

      const updatedUser: User = {
        ...user,
        credentials: [...(user.credentials || []), newCredential],
      }

      setUser(updatedUser)
      saveUserToStorage()
      localStorage.setItem('webauthn-required', 'true')
      console.log('User credentials updated successfully')

    } catch (error) {
      console.error('Error creating credential:', error)
    }
  }

  const requestWebAuthnAssertion = async () => {
    console.log('Requesting WebAuthn Assertion...')
    if (!user) return

    if (!user || !user.credentials || user.credentials.length === 0) {
      console.warn('No credentials available for assertion.')
      return
    }

    if (!window.PublicKeyCredential) {
      console.error('WebAuthn is not supported on this browser.')
      return
    }

    const webAuthnRequired = localStorage.getItem('webauthn-required') === 'true'
    if (!webAuthnRequired) {
      console.log('WebAuthn not required by server. Skipping assertion.')
      return
    }

    const base64ToUint8Array = (b64?: string) => b64 ? Uint8Array.from(atob(b64), c => c.charCodeAt(0)) : undefined

    const userCredentials: PublicKeyCredentialDescriptor[] = (user.credentials || [])
      .map(cred => {
        if (!cred.rawIdBase64) return null
        return {
          type: 'public-key',
          id: base64ToUint8Array(cred.rawIdBase64) as Uint8Array,
        }
      })
      .filter(Boolean) as PublicKeyCredentialDescriptor[]
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    console.log('Requesting WebAuthn assertion with challenge:', challenge)

    navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        allowCredentials: userCredentials,
        userVerification: 'preferred',
        timeout: 60000,
      },
    }).then((assertion) => {
      console.log('Assertion obtained:', assertion)
      // Here you would send the assertion to your server for verification
    }).catch((error) => {
      console.warn('Error obtaining assertion:', error)

      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.log('User cancelled the WebAuthn prompt or it timed out.')
      } else if (error instanceof DOMException && error.name === 'InvalidStateError') {
        console.log('No valid credentials available for assertion.')
      } else if (error instanceof DOMException && error.name === 'NotSupportedError') {
        console.log('The authenticator does not support the requested operation.')
      } else if (error instanceof DOMException && error.name === 'SecurityError') {
        console.log('The operation was insecure (e.g., not on HTTPS).')
      } else if (error instanceof DOMException && error.name === 'UnknownError') {
        console.log('An unknown error occurred during the WebAuthn operation.')
      }
    })
  }

  // Ask for assertion on tab focus
  const handleTabFocus = async () => {
    console.log('Tab focused, requesting WebAuthn assertion...')

    // Check if a WebAuthn assertion is already in progress using localStorage
    const webauthnInProgressTimestamp = localStorage.getItem('webauthn-next-assertion');
    const currentTime = Date.now();
    const timeoutDuration = 120_000; // 120 seconds

    if (webauthnInProgressTimestamp) {
      const timestamp = parseInt(webauthnInProgressTimestamp, 10);
      if (currentTime < timestamp + timeoutDuration) {
        console.log('WebAuthn assertion started recently, skipping new request.');
        // console.log(`Time remaining: ${((timestamp + timeoutDuration) - currentTime) / 1000} seconds`);
        return;
      }
    }

    localStorage.setItem('webauthn-next-assertion', currentTime.toString());

    await requestWebAuthnAssertion();

    setTimeout(() => {
      localStorage.removeItem('webauthn-next-assertion');
    }, timeoutDuration);
  };

  const handleEncryptData = async () => {
    if (!user || !dataToEncrypt) return;

    if (!user.credentials || user.credentials.length === 0) {
      console.error('No credentials available. Please create a credential first.');
      return;
    }

    try {
      console.log('Encrypting data using WebAuthn PRF...');

      // Create a salt for PRF
      // Explanation: A random value is generated for this single dataToEncrypt
      const prfInput = new Uint8Array(32);
      window.crypto.getRandomValues(prfInput);

      const base64ToUint8Array = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0))

      // Prepare allowCredentials with only PRF-supported credentials
      const userCredentials: PublicKeyCredentialDescriptor[] = (user.credentials || [])
        .filter(cred => cred.prfSupported && cred.rawIdBase64) // only use credentials that support PRF
        .map(cred => {
          return { type: 'public-key', id: base64ToUint8Array(cred.rawIdBase64!) as Uint8Array } as PublicKeyCredentialDescriptor
        })

      if (userCredentials.length === 0) {
        console.error('No credentials supporting PRF extension are available.');
        return;
      }

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Get assertion with PRF extension
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: userCredentials,
          userVerification: 'required',
          timeout: 60000,
          extensions: {
            prf: {
              eval: {
                first: prfInput,
              },
            },
          },
        },
      }) as PublicKeyCredential | null;

      if (!assertion) {
        console.error('Assertion failed.');
        return;
      }

      // Get PRF output from assertion
      const clientExtensionResults = (assertion as PublicKeyCredential & { getClientExtensionResults?: () => PRFResults }).getClientExtensionResults?.()
      console.log('Client extension results:', clientExtensionResults)

      const prfResult = clientExtensionResults?.prf?.results?.first as ArrayBuffer | undefined
      if (!prfResult) {
        console.error('PRF extension not supported or failed. Client extension results:', clientExtensionResults);
        return;
      }

      // Convert the PRF result (ArrayBuffer) to Uint8Array
      const prfByteArray = new Uint8Array(prfResult)
      console.log('PRF output obtained, deriving encryption key...');

      // Import PRF output as key material, getting a CryptoKey from raw bytes (prepared for HKDF)
      const prfCryptoKey = await window.crypto.subtle.importKey(
        'raw', // This means we are importing raw binary data as key material
        prfByteArray, // The PRF output from WebAuthn assertion
        { name: 'HKDF' }, // We specify that we will use HKDF for key derivation
        false, // The key material is not extractable
        ['deriveKey'] // We will use this key material to derive other keys (specifically an AES-GCM key)
      );

      // Derive a key for AES-GCM encryption using HKDF from the PRF output as CryptoKey (key material)
      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'HKDF', // We are using HKDF for key derivation
          salt: new Uint8Array(32), // A zeroed salt for simplicity; in production, use a proper random salt
          info: new TextEncoder().encode('pitch-webauthn-encryption'), // Contextual info for key derivation. This is necessary to ensure different keys for different purposes
          hash: 'SHA-256', // The hash function to use with HKDF
        },
        prfCryptoKey, // The key material obtained from PRF output
        { name: 'AES-GCM', length: 256 }, // We want to derive an key for AES-GCM with 256-bit length
        false, // The derived key is not extractable (cannot be exported, meaning it stays secure within the CryptoKey object)
        ['encrypt'] // We will use this derived key for encryption only
      );

      // Generate IV for AES-GCM
      const iv = new Uint8Array(12);
      window.crypto.getRandomValues(iv);

      // Encrypt the data using the AES-GCM algorithm with the derived key
      const encodedData = new TextEncoder().encode(dataToEncrypt);
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv }, // Set the algorithm and IV
        derivedKey, // The "Password" to encrypt the data
        encodedData // The actual data to encrypt
      );

      // Combine prfSalt, iv, and encryptedData into a single Uint8Array
      const combined = new Uint8Array(prfInput.length + iv.length + encryptedData.byteLength);
      combined.set(prfInput, 0);
      combined.set(iv, prfInput.length);
      combined.set(new Uint8Array(encryptedData), prfInput.length + iv.length);

      // Encode combined data to base64 for storage)
      const encryptedString = btoa(String.fromCharCode(...combined));
      console.log('Data encrypted successfully');

      // Store encrypted data in user.data
      const updatedUser: User = {
        ...user,
        data: [...user.data, encryptedString],
      };

      setUser(updatedUser);
      saveUserToStorage();
      setDataToEncrypt('');
    } catch (error) {
      console.error('Error encrypting data:', error);
    }
  };

  const handleDecryptData = async (encryptedString: string, index: number) => {
    if (!user) return;

    if (!user.credentials || user.credentials.length === 0) {
      console.error('No credentials available.');
      return;
    }

    try {
      console.log('Decrypting data using WebAuthn PRF...');

      // Decode the encrypted string
      const combined = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));

      // Extract prfInput, iv, and encrypted data (with hardcoded lengths (bad))
      const prfInput = combined.slice(0, 32);
      const iv = combined.slice(32, 44);
      const encryptedData = combined.slice(44);

      const base64ToUint8Array = (b64?: string) => b64 ? Uint8Array.from(atob(b64), c => c.charCodeAt(0)) : undefined
      const userCredentials: PublicKeyCredentialDescriptor[] = (user.credentials || [])
        .filter(cred => cred.prfSupported && cred.rawIdBase64) // only use credentials that support PRF
        .map(cred => {
          return { type: 'public-key', id: base64ToUint8Array(cred.rawIdBase64!) as Uint8Array } as PublicKeyCredentialDescriptor
        })

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Get assertion with PRF extension using the same salt
      console.log('userCredentials for PRF get() (decrypt):', userCredentials)
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: userCredentials,
          userVerification: 'required',
          timeout: 60000,
          extensions: {
            prf: {
              eval: {
                first: prfInput,
              },
            },
          },
        },
      }) as PublicKeyCredential | null;

      if (!assertion) {
        console.error('Assertion failed.');
        return;
      }

      console.log('Assertion returned (decrypt):', assertion)
      const prfResults = (assertion as PublicKeyCredential & { getClientExtensionResults?: () => PRFResults }).getClientExtensionResults?.()
      console.log('Client extension results (decrypt):', prfResults)

      if (!prfResults?.prf?.results?.first) {
        console.error('PRF extension not supported or failed. Client extension results:', prfResults)
        return
      }

      const prfOutput = new Uint8Array(prfResults.prf.results.first as ArrayBuffer)
      console.log('PRF output obtained, deriving decryption key...');

      // Derive AES-GCM key from PRF output (same process as encryption)
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        prfOutput,
        { name: 'HKDF' },
        false,
        ['deriveKey']
      );

      const aesKey = await window.crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          salt: new Uint8Array(32),
          info: new TextEncoder().encode('pitch-webauthn-encryption'),
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        aesKey,
        encryptedData
      );

      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      console.log('Data decrypted successfully:', decryptedText);

      // Update decrypted data state
      const newDecryptedData = [...decryptedData];
      newDecryptedData[index] = decryptedText;
      setDecryptedData(newDecryptedData);
    } catch (error) {
      console.error('Error decrypting data:', error);
    }
  };

  const setupUser = (newUser?: User) => {
    const storedUser = localStorage.getItem('webauthn-user')
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User)
    } else if (newUser) {
      setUser(newUser)
    } else {
      const createdUser: User = {
        id: crypto.randomUUID(),
        name: 'user_' + Math.floor(Math.random() * 10000),
        displayName: 'User ' + Math.floor(Math.random() * 10000),
        data: [],
      }
      setUser(createdUser)
      localStorage.setItem('webauthn-user', JSON.stringify(createdUser))
    }
  }

  useEffect(() => {
    setupUser();
  }, [])

  useEffect(() => {
    if (!window) return;
    if (!user) return;

    window.addEventListener('focus', handleTabFocus);
    handleTabFocus(); // also call once on mount

    return () => {
      window.removeEventListener('focus', handleTabFocus);
    };
  }, [user]);

  return (
    <main className="p-6">

      {/* User Info */}
      {user && (
        <div className="flex flex-col gap-4 items-start">
          <Button onPress={createWebAuthnCredential}>Create WebAuthn Credential</Button>
          <Button onPress={requestWebAuthnAssertion}>Request WebAuthn Assertion</Button>

          <div className="flex flex-col gap-2 w-full max-w-md mt-4">
            <h3 className="text-lg font-semibold">Encrypt Data with WebAuthn PRF</h3>
            <input
              type="text"
              value={dataToEncrypt}
              onChange={(e) => setDataToEncrypt(e.target.value)}
              placeholder="Enter data to encrypt..."
              className="border rounded px-3 py-2 bg-content1"
            />
            <Button onPress={handleEncryptData} disabled={!dataToEncrypt || !user.credentials?.length}>
              Encrypt & Store Data
            </Button>
          </div>

          {user.data && user.data.length > 0 && (
            <div className="flex flex-col gap-2 w-full max-w-md mt-4">
              <h3 className="text-lg font-semibold">Encrypted Data</h3>
              {user.data.map((encryptedItem, index) => (
                <div key={index} className="border rounded p-3 bg-content1">
                  <p className="text-xs text-gray-500 mb-2 break-all">Encrypted: {encryptedItem.substring(0, 50)}...</p>
                  {!decryptedData[index] && (
                    <Button size="sm" onPress={() => handleDecryptData(encryptedItem, index)}>
                      Decrypt
                    </Button>
                  )}
                  {decryptedData[index] && (
                    <p className="mt-2 text-success">Decrypted: {decryptedData[index]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-bold mb-2">User Info</h2>
          <pre className="bg-content1 shadow p-4 rounded">{JSON.stringify(user, null, 2)}</pre>
          {/* pre is used to display formatted JSON, because it preserves whitespace and formatting */}
        </div>
      )}

      {!user && (
        <div>
          <Spinner size="md" label="Loading user..." className="mt-6" />
        </div>
      )}

      {/* Save user Button */}
      <div className="mt-4">
        <Button onPress={saveUserToStorage} disabled={!user}>
          Save User to Storage
        </Button>
      </div>
    </main>
  )
}
