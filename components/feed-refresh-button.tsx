"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFeeds } from "./feed-context"
import { RefreshCw } from "lucide-react"

export default function FeedRefreshButton() {
  const { refreshFeeds, isRefreshing } = useFeeds()
  const { toast } = useToast()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const handleRefresh = async () => {
    try {
      const newItemsCount = await refreshFeeds()

      setLastRefreshed(new Date())

      toast({
        title: "Feeds refreshed",
        description:
          newItemsCount > 0 ? `Found ${newItemsCount} new item${newItemsCount === 1 ? "" : "s"}` : "No new items found",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Failed to refresh feeds",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {lastRefreshed && (
        <span className="text-xs text-muted-foreground">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
      )}
      <Button size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1">
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Refreshing..." : "Refresh Feeds"}
      </Button>
    </div>
  )
}
