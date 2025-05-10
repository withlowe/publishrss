"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFeeds } from "./feed-context"
import { Rss, Copy, Check, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function YourFeedSubscribe() {
  const { getYourFeedUrl, getYourPrivateFeedUrl, subscribeToYourFeed, subscribeToYourPrivateFeed } = useFeeds()
  const [copied, setCopied] = useState(false)
  const [privateCopied, setPrivateCopied] = useState(false)
  const [buttonCopied, setButtonCopied] = useState(false)
  const [privateButtonCopied, setPrivateButtonCopied] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isPrivateSubscribing, setIsPrivateSubscribing] = useState(false)
  const { toast } = useToast()

  const feedUrl = getYourFeedUrl()
  const privateFeedUrl = getYourPrivateFeedUrl()

  const handleCopy = async (isPrivate = false) => {
    try {
      const url = isPrivate ? privateFeedUrl : feedUrl
      await navigator.clipboard.writeText(url)

      if (isPrivate) {
        setPrivateCopied(true)
        setTimeout(() => setPrivateCopied(false), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      toast({
        title: "URL copied",
        description: `Your ${isPrivate ? "private" : "public"} feed URL has been copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the URL to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleSubscribe = async (isPrivate = false) => {
    if (isPrivate) {
      setIsPrivateSubscribing(true)
      try {
        await subscribeToYourPrivateFeed()
        toast({
          title: "Subscribed",
          description: "You've subscribed to your private feed in this reader",
        })
      } catch (error) {
        toast({
          title: "Subscription failed",
          description: error instanceof Error ? error.message : "Failed to subscribe to your feed",
          variant: "destructive",
        })
      } finally {
        setIsPrivateSubscribing(false)
      }
    } else {
      setIsSubscribing(true)
      try {
        await subscribeToYourFeed()
        toast({
          title: "Subscribed",
          description: "You've subscribed to your public feed in this reader",
        })
      } catch (error) {
        toast({
          title: "Subscription failed",
          description: error instanceof Error ? error.message : "Failed to subscribe to your feed",
          variant: "destructive",
        })
      } finally {
        setIsSubscribing(false)
      }
    }
  }

  const generateSimpleButtonCode = (isPrivate = false) => {
    const url = isPrivate ? privateFeedUrl : feedUrl
    return `<button 
  onclick="window.open('${url}', '_blank')"
  style="background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: system-ui, sans-serif; display: inline-flex; align-items: center; gap: 8px;"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1" />
  </svg>
  Subscribe${isPrivate ? " (Private)" : ""}
</button>`
  }

  const copySimpleButtonCode = async (isPrivate = false) => {
    try {
      const code = generateSimpleButtonCode(isPrivate)
      await navigator.clipboard.writeText(code)

      if (isPrivate) {
        setPrivateButtonCopied(true)
        setTimeout(() => setPrivateButtonCopied(false), 2000)
      } else {
        setButtonCopied(true)
        setTimeout(() => setButtonCopied(false), 2000)
      }

      toast({
        title: "Button code copied",
        description: `${isPrivate ? "Private" : "Public"} subscribe button HTML has been copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the button code to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rss className="h-5 w-5" />
          Your RSS Feeds
        </CardTitle>
        <CardDescription>Share your posts or subscribe to them in this reader</CardDescription>
      </CardHeader>

      {/* Public Feed Section */}
      <CardContent>
        <h3 className="text-sm font-medium mb-2">Public Feed</h3>
        <div className="flex space-x-2">
          <Input value={feedUrl} readOnly className="font-mono text-sm" />
          <Button size="icon" variant="outline" onClick={() => handleCopy(false)} className="flex-shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Share this URL with others so they can subscribe to your public posts
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <div className="flex w-full gap-2">
          <Button onClick={() => handleSubscribe(false)} disabled={isSubscribing} className="flex-1">
            {isSubscribing ? "Subscribing..." : "Subscribe"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => copySimpleButtonCode(false)}
            className="flex-shrink-0"
            title="Copy Subscribe button HTML"
          >
            {buttonCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>

      <div className="px-6 py-2 border-t"></div>

      {/* Private Feed Section */}
      <CardContent>
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-500" />
          Private Feed
        </h3>
        <div className="flex space-x-2">
          <Input value={privateFeedUrl} readOnly className="font-mono text-sm" />
          <Button size="icon" variant="outline" onClick={() => handleCopy(true)} className="flex-shrink-0">
            {privateCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-start gap-2 mt-2">
          <p className="text-sm text-muted-foreground">
            This URL contains a secret token. Only share it with people you trust to access your private posts.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <div className="flex w-full gap-2">
          <Button
            onClick={() => handleSubscribe(true)}
            disabled={isPrivateSubscribing}
            className="flex-1"
            variant="outline"
          >
            {isPrivateSubscribing ? "Subscribing..." : "Subscribe to Private Feed"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => copySimpleButtonCode(true)}
            className="flex-shrink-0"
            title="Copy Private Subscribe button HTML"
          >
            {privateButtonCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
