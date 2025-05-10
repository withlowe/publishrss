"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createStore } from "tinybase"
import { useCreateStore } from "tinybase/ui-react"

// Types
type User = {
  username: string
  isAdmin: boolean
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  isLoading: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const isRedirecting = useRef(false)
  const initialCheckDone = useRef(false)

  // Create a TinyBase store for authentication
  const store = useCreateStore(() => {
    const store = createStore()

    // Only access localStorage in browser environment
    if (isBrowser) {
      // Initialize the auth table if it doesn't exist
      if (!localStorage.getItem("auth-store")) {
        store.setTable("users", {
          admin: { username: "admin", passwordHash: hashPassword("admin"), isAdmin: true },
        })
        store.setCell("settings", "initialized", "initialized", true)

        // Save to localStorage
        const serialized = store.getJson()
        localStorage.setItem("auth-store", serialized)
      } else {
        // Load from localStorage
        const serialized = localStorage.getItem("auth-store")
        if (serialized) {
          store.setJson(serialized)
        }
      }
    }

    return store
  })

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

  // Check if user is logged in on initial load
  useEffect(() => {
    if (initialCheckDone.current) return

    const checkAuth = () => {
      if (isBrowser) {
        const storedUser = localStorage.getItem("auth-user")
        if (!storedUser) {
          // Auto-login as admin if no user is found
          const userData = {
            username: "admin",
            isAdmin: true,
          }
          setUser(userData)
          localStorage.setItem("auth-user", JSON.stringify(userData))
        } else {
          try {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
          } catch (error) {
            console.error("Error parsing stored user:", error)
            localStorage.removeItem("auth-user")
            // Auto-login as admin if there's an error
            const userData = {
              username: "admin",
              isAdmin: true,
            }
            setUser(userData)
            localStorage.setItem("auth-user", JSON.stringify(userData))
          }
        }
      } else {
        // Default user for SSR
        setUser({
          username: "admin",
          isAdmin: true,
        })
      }
      setIsLoading(false)
      initialCheckDone.current = true
    }

    checkAuth()
  }, [])

  // Handle routes
  useEffect(() => {
    if (isLoading || isRedirecting.current) return

    // If on root path, redirect to admin
    if (pathname === "/") {
      isRedirecting.current = true
      router.push("/admin")
      setTimeout(() => {
        isRedirecting.current = false
      }, 100)
    }
  }, [isLoading, pathname, router])

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error("You must be logged in to change your password")
    }

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Get users from TinyBase store
      const users = store.getTable("users")

      // Check if user exists
      const userData = users[user.username]
      if (!userData) {
        throw new Error("User not found")
      }

      // Check current password
      if (userData.passwordHash !== hashPassword(currentPassword)) {
        throw new Error("Current password is incorrect")
      }

      // Update password
      store.setCell("users", user.username, "passwordHash", hashPassword(newPassword))

      // Save to localStorage
      if (isBrowser) {
        const serialized = store.getJson()
        localStorage.setItem("auth-store", serialized)
      }

      return
    } catch (error) {
      throw error
    }
  }

  // Login function - kept for API compatibility
  const login = async (username: string, password: string) => {
    // This function is kept for API compatibility but is not used
    return
  }

  // Logout function - just resets the user
  const logout = () => {
    if (isRedirecting.current) return

    // Instead of logging out, we'll just reset to admin
    const userData = {
      username: "admin",
      isAdmin: true,
    }
    setUser(userData)
    if (isBrowser) {
      localStorage.setItem("auth-user", JSON.stringify(userData))
    }

    isRedirecting.current = true
    router.push("/admin")
    setTimeout(() => {
      isRedirecting.current = false
    }, 100)
  }

  // If still loading initial auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isLoading }}>{children}</AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
