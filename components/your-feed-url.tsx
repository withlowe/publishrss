"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useFeeds } from "./feed-context"
import { Copy, Check, Rss } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function YourFeedUrl() {
  const { getYourFeedUrl } = useFeeds()
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const feedUrl = getYourFeedUrl()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)

      toast({
        title: "URL copied",
        description: "Your feed URL has been copied to clipboard",
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rss className="h-5 w-5" />
          Share Your Feed
        </CardTitle>
        <CardDescription>Others can subscribe to your posts using this RSS feed URL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input value={feedUrl} readOnly className="font-mono text-sm" />
          <Button size="icon" variant="outline" onClick={handleCopy} className="flex-shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Share this URL with others so they can subscribe to your posts in their RSS reader
        </p>
      </CardContent>
    </Card>
  )
}
