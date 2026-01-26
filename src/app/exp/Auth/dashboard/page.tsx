"use client";

import { signOut, useSession } from '@/config/authClient';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import { Spinner } from '@heroui/spinner';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();

  return (
    <main className='p-4'>
      {session ?
        <>
          <pre className='bg-content1 p-4 rounded-md overflow-x-auto'>
            {JSON.stringify(session, null, 2)}
          </pre>
          <Button onPress={() => signOut()}>
            Logout
          </Button>
          <Link href="/exp/Auth/otherPage" className='block'>
            Go to Other Page
          </Link>
          <Link href="/exp/Auth/passkeys" className='block'>
            Manage Passkeys
          </Link>
        </>
        :
        (isPending ?
          <Spinner
            label='Loading session...'
            classNames={{
              base: "flex flex-row"
            }}
          />
          :
          <p>No active session found.</p>
        )
      }
    </main>
  );
}
