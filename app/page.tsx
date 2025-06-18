"use client"

import { useEffect, useState } from "react"
import PasswordGate from "@/components/password-gate"
import Dashboard from "@/components/dashboard"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        setCheckingAdmin(true)
        const userDoc = await getDoc(doc(db, "users", user.uid))
        setIsAdmin(userDoc.exists() && userDoc.data().isAdmin === true)
        setCheckingAdmin(false)
      } else {
        setIsAdmin(null)
      }
    }
    checkAdmin()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    setIsAdmin(null)
  }

  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loader"></span>
        <style jsx>{`
          .loader {
            width: 48px;
            height: 48px;
            border: 5px solid #e5e7eb;
            border-top: 5px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {!user ? (
        <PasswordGate />
      ) : isAdmin ? (
        <Dashboard />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2>
            <p className="text-gray-700 mb-6">You do not have admin privileges to access this dashboard.</p>
            <button
              onClick={handleSignOut}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
