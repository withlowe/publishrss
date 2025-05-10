"use client"

import type React from "react"

import { Suspense, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import FeedDisplay from "@/components/feed-display"
import PostsDisplay from "@/components/posts-display"
import AddFeedForm from "@/components/add-feed-form"
import CreatePostForm from "@/components/create-post-form"
import ManageFeeds from "@/components/manage-feeds"
import YourFeedSubscribe from "@/components/your-feed-subscribe"
import NowPage from "@/components/now-page"
import ImportExportPosts from "@/components/import-export-posts"
import MarkdownImportExport from "@/components/markdown-import-export"
import ChangePassword from "@/components/change-password"
import { FeedProvider } from "@/components/feed-context"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, LogIn } from "lucide-react"

export default function HomePage() {
  const { user, login, logout } = useAuth()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      await login(username, password)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoggingIn(false)
    }
  }

  // If no user is logged in, show login form
  if (!user) {
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

                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? (
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

  return (
    <FeedProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Publishrss</h1>
        <Tabs defaultValue="reads">
          <div className="flex justify-start mb-6">
            <TabsList className="bg-muted inline-flex h-10 items-center justify-center rounded-md p-1">
              <TabsTrigger value="reads">Reads</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="now">Now</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reads">
            <h2 className="text-xl font-semibold mb-4">Combined Feed</h2>
            <Suspense fallback={<FeedSkeleton />}>
              <FeedDisplay />
            </Suspense>
          </TabsContent>

          <TabsContent value="posts">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Your Posts</h2>
                <div className="mb-6">
                  <CreatePostForm />
                </div>
                <PostsDisplay />
              </div>
              <div className="space-y-6">
                <YourFeedSubscribe />
                <ImportExportPosts />
                <MarkdownImportExport />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="now">
            <div className="grid grid-cols-1 gap-6">
              <NowPage />
            </div>
          </TabsContent>

          <TabsContent value="manage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Add New Feed</h2>
                  <AddFeedForm />
                </div>
                <ManageFeeds />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
                <ChangePassword />

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>Your account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Username</p>
                      <p className="text-sm">{user.username}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm">{user.isAdmin ? "Administrator" : "User"}</p>
                    </div>
                    <div className="pt-2">
                      <Button variant="destructive" onClick={logout} className="w-full">
                        Log Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </FeedProvider>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  )
}
