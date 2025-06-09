"use client"

import { useState } from "react"
import PasswordGate from "@/components/password-gate"
import Dashboard from "@/components/dashboard"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = (password: string) => {
    // For demo purposes, using a simple password check
    // In a real app, you would validate against a secure backend
    if (password === "admin123") {
      setIsAuthenticated(true)
    } else {
      alert("Incorrect password. Please try again.")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {!isAuthenticated ? <PasswordGate onLogin={handleLogin} /> : <Dashboard onLogout={handleLogout} />}
    </main>
  )
}
