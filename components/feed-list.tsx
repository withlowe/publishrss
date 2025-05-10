import { getFeedItems } from "@/lib/db"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

export default async function FeedList() {
  const feedItems = await getFeedItems()

  if (feedItems.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No feed items yet. Subscribe to RSS feeds or create your own posts.</p>
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
                <CardDescription className="flex items-center gap-2">
                  {item.feedTitle}
                  <span className="text-xs text-muted-foreground">
                    • {formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
                  </span>
                </CardDescription>
              </div>
              <Badge variant={item.isOwn ? "default" : "outline"}>{item.isOwn ? "Your Post" : item.feedTitle}</Badge>
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
