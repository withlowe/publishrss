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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const redirectInProgress = useRef(false)
  const initialCheckDone = useRef(false)

  // Create a TinyBase store for authentication
  const store = useCreateStore(() => {
    const store = createStore()

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
      const storedUser = localStorage.getItem("auth-user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (error) {
          console.error("Error parsing stored user:", error)
          localStorage.removeItem("auth-user")
        }
      }
      setIsLoading(false)
      initialCheckDone.current = true
    }

    checkAuth()
  }, [])

  // Handle protected routes
  useEffect(() => {
    if (isLoading || redirectInProgress.current) return

    const handleRouteProtection = () => {
      // If not logged in and trying to access admin page, redirect to login
      if (!user && pathname?.startsWith("/admin")) {
        redirectInProgress.current = true
        router.push("/")
        // Reset the flag after a delay to prevent immediate re-triggering
        setTimeout(() => {
          redirectInProgress.current = false
        }, 500)
      }

      // If logged in and on login page, redirect to admin
      if (user && pathname === "/") {
        redirectInProgress.current = true
        router.push("/admin")
        // Reset the flag after a delay to prevent immediate re-triggering
        setTimeout(() => {
          redirectInProgress.current = false
        }, 500)
      }
    }

    handleRouteProtection()
  }, [user, isLoading, pathname, router])

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true)

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

      // Set user in state and localStorage
      const userData = {
        username: user.username,
        isAdmin: user.isAdmin,
      }

      setUser(userData)
      localStorage.setItem("auth-user", JSON.stringify(userData))

      // Redirect to admin page
      redirectInProgress.current = true
      router.push("/admin")
      setTimeout(() => {
        redirectInProgress.current = false
      }, 500)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

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
      const serialized = store.getJson()
      localStorage.setItem("auth-store", serialized)

      return
    } catch (error) {
      throw error
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth-user")
    redirectInProgress.current = true
    router.push("/")
    setTimeout(() => {
      redirectInProgress.current = false
    }, 500)
  }

  // If still loading initial auth state, show loading indicator
  if (isLoading && pathname !== "/") {
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
