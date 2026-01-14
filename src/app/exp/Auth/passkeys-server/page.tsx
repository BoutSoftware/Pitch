import { auth } from '@/config/auth';
import { prisma } from '@/config/db';
import { headers } from 'next/headers';

export default async function UserPasskeysPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const passkeys = await prisma.passkey.findMany({
    where: {
      userId: session?.user?.id
    }
  });

  return (
    <main className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>User Passkeys</h1>

      {passkeys.length === 0 ? (
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
