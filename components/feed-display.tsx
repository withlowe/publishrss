"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Lock } from "lucide-react"
import { useFeeds } from "./feed-context"

export default function FeedDisplay() {
  const { feedItems } = useFeeds()

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

  if (feedItems.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No feed items yet. Subscribe to RSS feeds or create your own posts!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedItems.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="font-mono text-xs flex items-center gap-2">
                  {item.feedTitle}
                  <span className="text-muted-foreground">• {formatRelativeTime(item.pubDate)}</span>
                </CardDescription>
              </div>
              {item.isOwn && (
                <Badge
                  variant={item.isPrivate ? "outline" : "default"}
                  className={item.isPrivate ? "border-amber-500 text-amber-500 flex items-center gap-1" : ""}
                >
                  {item.isPrivate ? (
                    <>
                      <Lock className="h-3 w-3" />
                      Private
                    </>
                  ) : (
                    "Public"
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </CardContent>
          {item.link && (
            <CardFooter className="pt-0">
              <a
                href={item.link}
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
