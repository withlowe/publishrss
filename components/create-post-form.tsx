"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFeeds } from "./feed-context"
import TiptapEditor from "./tiptap-editor"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LockIcon } from "lucide-react"

export default function CreatePostForm() {
  const [content, setContent] = useState("<p></p>")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { addPost } = useFeeds()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (content === "<p></p>" || !content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      addPost(content, isPrivate)

      toast({
        title: "Post created",
        description: `Your post has been published to your ${isPrivate ? "private" : "public"} feed.`,
      })

      setContent("<p></p>")
      // Keep the privacy setting as is for the next post
    } catch (error) {
      toast({
        title: "Error creating post",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <TiptapEditor content={content} onChange={setContent} placeholder="Write your post content here..." />
          <p className="text-sm text-muted-foreground">The first few words of your post will be used as the title.</p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} />
          <Label htmlFor="private-mode" className="flex items-center gap-1.5 cursor-pointer">
            <LockIcon className="h-3.5 w-3.5" />
            Make this post private
          </Label>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Publishing..." : `Publish ${isPrivate ? "Private" : "Public"} Post`}
        </Button>
      </form>
    </div>
  )
}
