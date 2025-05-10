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
import { FeedProvider } from "@/components/feed-context"

export default function AdminPage() {
  return (
    <FeedProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">PublishRSS</h1>

        <Tabs defaultValue="reads">
          <div className="flex justify-start mb-6">
            <TabsList className="bg-muted inline-flex h-10 items-center justify-center rounded-md p-1">
              <TabsTrigger value="reads">Reads</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="now">Now</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
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
              <div>
                <YourFeedSubscribe />
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
