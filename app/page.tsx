"use client"

import { useState } from "react"
import PasswordGate from "@/components/password-gate"
import Dashboard from "@/components/dashboard"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {!user ? <PasswordGate /> : <Dashboard />}
    </main>
  )
}
