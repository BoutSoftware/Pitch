"use client"

import { authClient } from '@/config/authClient'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Link } from '@heroui/link'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function AuthPage() {
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    name: ''
  })
  const router = useRouter();

  const handleSignIn = async () => {
    const { data, error } = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
      callbackURL: "/exp/Auth/dashboard",
    }, {
      onSuccess: () => {
        router.push('/exp/Auth/dashboard');
      }
    })

    if (error) {
      console.error("Sign Up Error:", error)
    } else {
      console.log("Sign Up Success:", data)
    }
  }

  return (
    <main className='p-8'>
      <form
        className='max-w-sm flex flex-col gap-4'
      >
        <Input label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Input label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Button onPress={handleSignIn}>Sign Up</Button>
      </form>

      <p className='mt-4'>
        Already have an account? <Link href="/exp/Auth/login">Login</Link>
      </p>
    </main>
  )
}
