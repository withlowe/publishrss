"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, LogIn } from "lucide-react"
import { createStore } from "tinybase"
import { useCreateStore } from "tinybase/ui-react"
import { useAuth } from "@/components/auth-provider"

// Helper function to safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const { user, login, isLoading } = useAuth()
  const router = useRouter()

  // Create a TinyBase store for authentication
  const store = useCreateStore(() => {
    const store = createStore()

    // Only run this code in the browser
    if (typeof window !== "undefined") {
      // Initialize the auth table if it doesn't exist
      if (!safeLocalStorage.getItem("auth-store")) {
        store.setTable("users", {
          admin: { username: "admin", passwordHash: hashPassword("admin"), isAdmin: true },
        })
        store.setCell("settings", "initialized", "initialized", true)

        // Save to localStorage
        const serialized = store.getJson()
        safeLocalStorage.setItem("auth-store", serialized)
      } else {
        // Load from localStorage
        const serialized = safeLocalStorage.getItem("auth-store")
        if (serialized) {
          store.setJson(serialized)
        }
      }
    }

    return store
  })

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return

    // Check if user is already logged in - but don't redirect here
    // Let the AuthProvider handle redirects
    const checkAuth = () => {
      setInitializing(false)
    }

    // Short delay to prevent immediate checks
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  // Simple password hashing function (not secure for production)
  function hashPassword(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(username, password)
      // Don't redirect here - let the AuthProvider handle it
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  // Only show loading indicator in browser environment
  if ((initializing || isLoading) && typeof window !== "undefined") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is already logged in, don't show login form (only in browser)
  if (user && typeof window !== "undefined") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
      <div className="w-full max-w-md px-4">
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Publishrss</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your feeds</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-xs text-center text-muted-foreground mt-2">
              Default credentials: username <span className="font-mono">admin</span> / password{" "}
              <span className="font-mono">admin</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
