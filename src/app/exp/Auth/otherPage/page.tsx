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
          <div className='space-y-6'>
            <h1 className='text-3xl font-bold'>Welcome, {session.user.name}!</h1>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-linear-to-br from-primary-500 to-primary-400 rounded-lg p-6 text-primary-foreground shadow-lg'>
                <h2 className='text-sm font-semibold opacity-90'>User Information</h2>
                <p className='text-2xl font-bold mt-2'>{session.user.email}</p>
                <p className='text-sm mt-2 opacity-75'>Joined {new Date(session.user.createdAt).toLocaleDateString()}</p>
              </div>

              <div className='bg-linear-to-br from-secondary-500 to-secondary-400 rounded-lg p-6 text-secondary-foreground shadow-lg'>
                <h2 className='text-sm font-semibold opacity-90'>Session Details</h2>
                <p className='text-sm mt-2'>Expires: {new Date(session.session.expiresAt).toLocaleDateString()}</p>
                <p className='text-xs mt-2 opacity-75'>IP: {session.session.ipAddress}</p>
              </div>
            </div>

            <div className='bg-content2 rounded-lg p-4'>
              <h3 className='font-semibold text-sm mb-2'>Session Token</h3>
              <code className='text-xs break-all '>{session.session.token}</code>
            </div>

            <Button
              color='danger'
              onPress={() => signOut()}
              className='w-full'
            >
              Sign Out
            </Button>

            <div className='text-center'>
              <Link href="/exp/Auth/dashboard" className='text-secondary hover:underline'>
                Go to Dashboard
              </Link>
            </div>
          </div>
        </>
        :
        (isPending ?
          <Spinner
            label='Loading session...'
            classNames={{
              base: "flex flex-row gap-4"
            }}
          />
          :
          <p>No active session found.</p>
        )
      }
    </main>
  )
}
