"use client"

import { useSession } from "@/config/authClient"
import { redirect } from "next/navigation"

export default function IndexPage() {
  const { data: session, isPending } = useSession()

  if (!isPending) {
    if (session) {
      redirect('/exp/Auth/dashboard')
    } else {
      redirect('/exp/Auth/login')
    }
  }
}