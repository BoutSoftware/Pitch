"use client"

import { signOut, useSession } from '@/config/authClient'
import { Button } from '@heroui/button'
import { Link } from '@heroui/link'
import { Spinner } from '@heroui/spinner'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      // Redirect to login page or show a message
      console.log('No active session, redirecting to login...')
      router.push('/exp/Auth/login')
    }
  }, [session, isPending])

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
          <Link href="/exp/Auth/dashboard">
            Go to Dashboard
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
  )
}
