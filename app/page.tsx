"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, LogIn } from "lucide-react"
import { createStore } from "tinybase"
import { useCreateStore } from "tinybase/ui-react"

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()
  const isRedirecting = useRef(false)
  const initialCheckDone = useRef(false)

  // Create a TinyBase store for authentication
  const store = useCreateStore(() => {
    const store = createStore()

    // Initialize the auth table if it doesn't exist
    if (isBrowser && !localStorage.getItem("auth-store")) {
      store.setTable("users", {
        admin: { username: "admin", passwordHash: hashPassword("admin"), isAdmin: true },
      })
      store.setCell("settings", "initialized", "initialized", true)

      // Save to localStorage
      const serialized = store.getJson()
      localStorage.setItem("auth-store", serialized)
    } else if (isBrowser) {
      // Load from localStorage
      const serialized = localStorage.getItem("auth-store")
      if (serialized) {
        store.setJson(serialized)
      }
    }

    return store
  })

  useEffect(() => {
    // Only run this check once
    if (initialCheckDone.current) return

    // Check if user is already logged in
    if (isBrowser) {
      const isLoggedIn = localStorage.getItem("auth-user")
      if (isLoggedIn && !isRedirecting.current) {
        isRedirecting.current = true
        router.push("/admin")
        setTimeout(() => {
          isRedirecting.current = false
        }, 100)
      } else {
        setInitializing(false)
      }
    } else {
      setInitializing(false)
    }

    initialCheckDone.current = true
  }, [router])

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
    if (isRedirecting.current) return

    setError(null)
    setLoading(true)

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Get users from TinyBase store
      const users = store.getTable("users")

      // Check if user exists
      const user = users[username]
      if (!user) {
        throw new Error("Invalid username or password")
      }

      // Check password
      if (user.passwordHash !== hashPassword(password)) {
        throw new Error("Invalid username or password")
      }

      // Set logged in user
      if (isBrowser) {
        localStorage.setItem(
          "auth-user",
          JSON.stringify({
            username: user.username,
            isAdmin: user.isAdmin,
          }),
        )
      }

      // Redirect to admin page
      isRedirecting.current = true
      router.push("/admin")
      setTimeout(() => {
        isRedirecting.current = false
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800">
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

              <Button type="submit" className="w-full" disabled={loading || isRedirecting.current}>
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
