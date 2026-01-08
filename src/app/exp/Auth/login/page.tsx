"use client"

import PasswordInput from '@/components/PasswordInput'
import { authClient } from '@/config/authClient'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import React from 'react'

export default function LoginPage() {
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    loading: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setForm({ ...form, loading: true });
    const { data, error } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
      rememberMe: false,
      callbackURL: "/exp/Auth/dashboard"
    }, {
      redirect: 'follow'
    })
    setForm({ ...form, loading: false });

    if (error) {
      console.error("Login Error:", error)
    } else {
      console.log("Login Success:", data)
    }
  }

  return (
    <main className='p-8'>
      <form onSubmit={handleSubmit} className='max-w-sm flex flex-col gap-4'>
        <h1>Login Page</h1>
        <Input label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <PasswordInput label="Password" value={form.password} onValueChange={value => setForm({ ...form, password: value })} />
        <Button type="submit" isLoading={form.loading}>Login</Button>
      </form>
    </main>
  )
}
