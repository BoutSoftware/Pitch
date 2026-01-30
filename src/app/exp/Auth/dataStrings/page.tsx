"use client";

import { useSession } from '@/config/authClient';
import { decrypt, encrypt, extractParts, getPrfResult } from '@/services/encryption';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { DataString } from '@prisma-gen/client';
import React from 'react';

interface PasskeyIDs {
  id: string;
  credentialID: string;
}

export default function UserDataStringsPage() {
  const [passkeys, setPasskeys] = React.useState<PasskeyIDs[]>();
  const [dataStrings, setDataStrings] = React.useState<DataString[]>();
  const { data: session, isPending } = useSession();

  const getUserPasskeys = async () => {
    if (!session?.user?.id) return [];
    const response = await fetch('/api/user/passkeys?onlyIds=true&prfSupported=true');
    const resBody = await response.json()
      .catch(() => ({}));

    if (response.ok && resBody.data) {
      setPasskeys(resBody.data as PasskeyIDs[]);
    } else {
      setPasskeys([]);
    }
  };

  const getDataStrings = async () => {
    const response = await fetch('/api/user/dataStrings');
    const resBody = await response.json()
      .catch(() => ({}));

    if (!response.ok || !resBody.data) {
      console.error('Failed to fetch data strings');
      return;
    }

    setDataStrings(resBody.data as DataString[]);
  };

  React.useEffect(() => {
    if (!session?.user?.id || isPending) return;

    getUserPasskeys();
    getDataStrings();
  }, [session?.user?.id, isPending]);
  return (
    <main className='p-4 flex flex-col gap-4'>
      {/* <Button onPress={getPasskeyEval}>Get Passkey PRF Eval</Button> */}
      <h1 className='text-2xl font-bold'>User Data Strings</h1>

      <CreateDataStringForm
        passkeys={passkeys || []}
        onCreated={() => {
          getDataStrings();
        }}
      />

      {dataStrings && (
        <section>
          <h2 className='text-xl font-semibold mb-2'>Existing Data Strings:</h2>
          <div>
            {dataStrings.map((ds) => (
              <DataStringCard key={ds.id} dataString={ds} passkeys={passkeys || []} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const DataStringCard = ({ dataString, passkeys }: { dataString: DataString; passkeys: PasskeyIDs[] }) => {
  const [decryptedValue, setDecryptedValue] = React.useState<string | null>(null);

  const handleDecrypt = async () => {
    const passkey = passkeys.find((pk) => pk.id === dataString.passkeyId);

    if (!passkey) {
      console.error('No matching passkey found for decryption');
      return;
    }

    const value = dataString.encryptedData;
    const { prfInput } = await extractParts(value);

    const { prfKey, assertion } = await getPrfResult(
      prfInput,
      [{
        id: passkey.id,
        prfSupported: true,
        type: 'public-key',
        rawIdBase64: passkey.credentialID,
      }],
      passkey.credentialID,
    );

    if (!prfKey || !assertion) {
      console.error('Failed to get PRF result for decryption');
      return;
    }

    console.log('Decrypting with PRF Input:', Buffer.from(prfInput).toString('base64'));

    const decrypted = await decrypt(
      value,
      Buffer.from(prfKey).toString('base64'),
    );

    setDecryptedValue(decrypted);
  };

  return (
    <Card className='mb-4'>
      <CardHeader>
        <h3 className='text-lg'><strong>Data String ID:</strong> {dataString.id}</h3>
      </CardHeader>
      <CardBody className='gap-2'>
        <p><strong>Encrypted Data:</strong> {dataString.encryptedData}</p>
        <p><strong>Passkey ID:</strong> {dataString.passkeyId}</p>
      </CardBody>
      <CardFooter>
        {decryptedValue ? (
          <p><strong>Decrypted Value:</strong> {decryptedValue}</p>
        ) : (
          <Button onPress={handleDecrypt}>Decrypt Value</Button>
        )}
      </CardFooter>
    </Card>
  );
};

const CreateDataStringForm = ({ onCreated: handleCreated, passkeys }: { onCreated: () => void; passkeys: PasskeyIDs[] }) => {
  const [value, setValue] = React.useState('');
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value) return;
    if (!session?.user?.id) return;

    // const prfInput = new TextEncoder().encode(session.user.id);
    // Better use a random unique input per data string
    const prfInput = new Uint8Array(32);
    crypto.getRandomValues(prfInput);

    const { prfKey, assertion } = await getPrfResult(
      prfInput,
      passkeys.map((pk) => ({
        id: pk.id,
        prfSupported: true,
        type: 'public-key',
        rawIdBase64: pk.credentialID,
      })),
    );

    const passkeyId = passkeys.find((pk) => pk.credentialID === Buffer.from(assertion.rawId).toString('base64'))?.id || null;

    if (!prfKey || !assertion || !passkeyId) {
      console.error('Failed to get PRF result or find matching passkey ID');
      return;
    }

    console.log('Encrypting with PRF Input:', Buffer.from(prfInput).toString('base64'));

    const encryptedData = await encrypt(
      value,
      prfInput,
      Buffer.from(prfKey).toString('base64'),
      Buffer.from(assertion.rawId).toString('base64')
    );

    await fetch('/api/user/dataStrings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: encryptedData,
        passkeyId: passkeyId,
      }),
    });

    setValue('');
    handleCreated();
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2 max-w-sm'>
      <h3 className='font-medium'>Create New Data String:</h3>

      <div className='flex gap-2 items-center'>
        <Input label='Value' placeholder='Write something...' value={value} onChange={(e) => setValue(e.target.value)} />
        <Button type='submit' className='shrink-0'>Create</Button>
      </div>
    </form>
  );
};