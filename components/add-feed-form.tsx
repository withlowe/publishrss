"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useFeeds } from "./feed-context"
import { Copy, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AddFeedForm() {
  const [feedUrl, setFeedUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const { addFeed, isLoading } = useFeeds()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!feedUrl) {
      setError("Please enter a valid URL")
      return
    }

    try {
      // Basic URL validation
      new URL(feedUrl)
    } catch (error) {
      setError("Please enter a valid URL including http:// or https://")
      return
    }

    try {
      await addFeed(feedUrl)

      toast({
        title: "Feed added",
        description: "The feed has been added to your subscriptions.",
      })

      setFeedUrl("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")

      toast({
        title: "Error adding feed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)

      toast({
        title: "URL copied",
        description: "Feed URL has been copied to clipboard",
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the URL to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedUrl">Feed URL</Label>
          <div className="flex space-x-2">
            <Input
              id="feedUrl"
              placeholder="https://example.com/feed.xml"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!feedUrl}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Enter the URL of an RSS feed you want to subscribe to</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            "Add Feed"
          )}
        </Button>
      </form>
    </div>
  )
}
