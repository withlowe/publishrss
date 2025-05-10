"use client"

import { Suspense } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FeedRefreshButton from "@/components/feed-refresh-button"

export default function AdminPage() {
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto" />
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Combined Feed</h2>
              <FeedRefreshButton />
            </div>
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
                    <CardDescription>Your account details and session management</CardDescription>
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
