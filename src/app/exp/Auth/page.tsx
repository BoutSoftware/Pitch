"use client"

import { authClient } from '@/config/authClient'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import React from 'react'

export default function AuthPage() {
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    name: ''
  })

  const handleSignIn = async () => {
    const { data, error } = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
      callbackURL: "/",
    },
      {
        redirect: "manual"
      }
    )

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
        <Button onPress={handleSignIn} type="submit">Sign Up</Button>
      </form>
    </main>
  )
}
