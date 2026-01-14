"use client";

import { useSession } from '@/config/authClient';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { Passkey } from '@prisma-gen/client';
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
      setPasskeys(resBody.data);
    } else {
      setPasskeys([]);
    }
  };

  const getOptions = async () => {
    const response = await fetch('/api/user/passkeys/new', {
      method: 'GET',
    });
    const resBody = await response.json();

    console.log('Registration options response:', resBody);

    return resBody.data;
  };

  React.useEffect(() => {
    if (!session) return;

    getUserPasskeys();
  }, [session?.user?.id]);

  return (
    <main className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>User Passkeys</h1>

      <Button
        onPress={getOptions}
      >
        Generate New Passkey Options
      </Button>

      {passkeys === undefined ? (
        <Spinner label='Loading passkeys...' />
      ) : passkeys.length === 0 ? (
        <p>No passkeys found for this user.</p>
      ) : (
        <ul>
          {passkeys.map((passkey) => (
            <li key={passkey.id} className='mb-2'>
              <strong>ID:</strong> {passkey.id} <br />
              <strong>Created At:</strong> {new Date(passkey.createdAt).toLocaleString()} <br />
              <strong>Updated At:</strong> {new Date(passkey.updatedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
