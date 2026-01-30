"use client";

import { useSession } from '@/config/authClient';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { Passkey } from '@prisma-gen/client';
import { startRegistration } from '@simplewebauthn/browser';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/server';
import React from 'react';

export default function UserPasskeysPage() {
  const { data: session } = useSession();
  const [passkeys, setPasskeys] = React.useState<Passkey[]>();

  const getUserPasskeys = async () => {
    if (!session?.user?.id) return [];
    const response = await fetch('/api/user/passkeys');
    const resBody = await response.json()
      .catch(() => ({}));

    if (response.ok && resBody.data) {
      setPasskeys(resBody.data as Passkey[]);
    } else {
      setPasskeys([]);
    }
  };

  const getPasskeyCreationOptions = async () => {
    const response = await fetch('/api/user/passkeys/new', {
      method: 'GET',
    });
    const resBody = await response.json() as { data: PublicKeyCredentialCreationOptionsJSON; };

    console.log("Passkey Creation Options:", resBody.data);

    return resBody.data;
  };

  const createPasskey = async () => {
    // see if environment supports webauthn
    if (!window.PublicKeyCredential) {
      console.error("WebAuthn is not supported on this browser.");
      return;
    }

    const options = await getPasskeyCreationOptions();

    const registrationResponse = await startRegistration({
      optionsJSON: options,
    });

    console.log("Registration Response:", registrationResponse);

    const response = await fetch('/api/user/passkeys/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenge: options.challenge,
        credential: registrationResponse,
      }),
    });
    const resBody = await response.json();

    if (!response.ok) {
      console.error("Error creating passkey:", resBody);
    }

    console.log("Passkey created successfully:", resBody);

    // Refresh the passkey list
    getUserPasskeys();
  };


  React.useEffect(() => {
    if (!session) return;

    getUserPasskeys();
  }, [session?.user?.id]);

  return (
    <main className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>User Passkeys</h1>

      <Button
        onPress={getPasskeyCreationOptions}
      >
        Generate New Passkey Options
      </Button>

      <Button
        className='ml-4'
        onPress={createPasskey}
      >
        Create New Passkey
      </Button>

      {passkeys === undefined ? (
        <Spinner label='Loading passkeys...' />
      ) : passkeys.length === 0 ? (
        <p>No passkeys found for this user.</p>
      ) : (
        <ul className='grid grid-cols-2 gap-4 mt-8'>
          {passkeys.map((passkey) => (
            <li key={passkey.id}>
              <Card>
                <CardHeader>
                  <h2 className='text-lg font-semibold'>Passkey ID: {passkey.id}</h2>
                </CardHeader>
                <CardBody>
                  <p><strong>Created At:</strong> {new Date(passkey.createdAt).toLocaleString()}</p>
                  <p><strong>Updated At:</strong> {new Date(passkey.updatedAt).toLocaleString()}</p>
                </CardBody>
                <CardFooter>
                  <Button variant='bordered' onPress={() => {/* Add any action here */ }}>Action</Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
