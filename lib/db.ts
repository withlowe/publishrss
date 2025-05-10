// This is a simple in-memory database for development purposes
// In a production app, you would use a real database

// Types
export type Feed = {
  id: string
  title: string
  description: string
  url: string
  link: string
  lastUpdated: string
}

export type FeedItem = {
  id: string
  feedId: string
  feedTitle: string
  title: string
  content: string
  link?: string
  pubDate: string
  isOwn: boolean
}

// In-memory storage
let feeds: Feed[] = []
let feedItems: FeedItem[] = []

// Initialize with some sample data
if (feedItems.length === 0) {
  feedItems = [
    {
      id: "sample-1",
      feedId: "sample",
      feedTitle: "Sample Feed",
      title: "Welcome to your RSS Reader",
      content: "<p>This is a sample post to get you started. Subscribe to RSS feeds or create your own posts!</p>",
      pubDate: new Date().toISOString(),
      isOwn: true,
    },
  ]
}

// Feed operations
export async function getFeeds(): Promise<Feed[]> {
  return [...feeds]
}

export async function addFeed(feed: Omit<Feed, "id" | "lastUpdated">): Promise<Feed> {
  const id = Math.random().toString(36).substring(2, 9)
  const newFeed: Feed = {
    ...feed,
    id,
    lastUpdated: new Date().toISOString(),
  }

  feeds = [...feeds, newFeed]
  return newFeed
}

// Feed item operations
export async function getFeedItems(): Promise<FeedItem[]> {
  // Sort by date, newest first
  return [...feedItems].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
}

export async function addFeedItems(items: Omit<FeedItem, "id">[]): Promise<FeedItem[]> {
  const newItems = items.map((item) => ({
    ...item,
    id: Math.random().toString(36).substring(2, 9),
  }))

  feedItems = [...feedItems, ...newItems]
  return newItems
}

export async function addUserPost(post: { title: string; content: string }): Promise<FeedItem> {
  const newItem: FeedItem = {
    id: Math.random().toString(36).substring(2, 9),
    feedId: "own",
    feedTitle: "Your Feed",
    title: post.title,
    content: post.content,
    pubDate: new Date().toISOString(),
    isOwn: true,
  }

  feedItems = [...feedItems, newItem]
  return newItem
}
