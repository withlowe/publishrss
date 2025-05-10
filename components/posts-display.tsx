"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, Lock } from "lucide-react"
import { useFeeds } from "./feed-context"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PostsDisplay() {
  const { getYourPosts, getPublicPosts, getPrivatePosts, deletePost } = useFeeds()
  const { toast } = useToast()
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const allPosts = getYourPosts()
  const publicPosts = getPublicPosts()
  const privatePosts = getPrivatePosts()

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  const handleDeletePost = (id: string) => {
    deletePost(id)
    setPostToDelete(null)
    toast({
      title: "Post deleted",
      description: "Your post has been deleted successfully",
    })
  }

  const renderPosts = (posts: typeof allPosts) => {
    if (posts.length === 0) {
      return (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No posts found. Go to the top of this page to create a new post!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <CardDescription className="font-mono text-xs flex items-center gap-2">
                    {post.feedTitle}
                    <span className="text-muted-foreground">• {formatRelativeTime(post.pubDate)}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={post.isPrivate ? "outline" : "default"}
                    className={post.isPrivate ? "border-amber-500 text-amber-500 flex items-center gap-1" : ""}
                  >
                    {post.isPrivate ? (
                      <>
                        <Lock className="h-3 w-3" />
                        Private
                      </>
                    ) : (
                      "Public"
                    )}
                  </Badge>
                  <AlertDialog open={postToDelete === post.id} onOpenChange={(open) => !open && setPostToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setPostToDelete(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this post? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePost(post.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </CardContent>
            {post.link && (
              <CardFooter className="pt-0">
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Read more <ExternalLink className="h-3 w-3" />
                </a>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="private">Private</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderPosts(allPosts)}</TabsContent>

        <TabsContent value="public">{renderPosts(publicPosts)}</TabsContent>

        <TabsContent value="private">{renderPosts(privatePosts)}</TabsContent>
      </Tabs>
    </div>
  )
}
