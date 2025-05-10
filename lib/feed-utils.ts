import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import Parser from "rss-parser"
import { addFeed, addFeedItems } from "./db"

// Define types
type FeedType = {
  id: string
  title: string
  description: string
  url: string
  link: string
  lastUpdated: string
}

type FeedItem = {
  id: string
  feedId: string
  feedTitle: string
  title: string
  content: string
  link?: string
  pubDate: string
  isOwn: boolean
}

type Post = {
  title: string
  content: string
}

// Path to our "database" files
const DATA_DIR = path.join(process.cwd(), "data")
const FEEDS_FILE = path.join(DATA_DIR, "feeds.json")
const ITEMS_FILE = path.join(DATA_DIR, "items.json")

// Initialize data directory and files if they don't exist
async function initDataFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })

    // Check and initialize feeds file
    let feedsExists = false
    try {
      await fs.access(FEEDS_FILE)
      feedsExists = true
    } catch {
      // File doesn't exist
    }

    if (!feedsExists) {
      await fs.writeFile(FEEDS_FILE, JSON.stringify([]))
    }

    // Check and initialize items file
    let itemsExists = false
    try {
      await fs.access(ITEMS_FILE)
      itemsExists = true
    } catch {
      // File doesn't exist
    }

    if (!itemsExists) {
      await fs.writeFile(ITEMS_FILE, JSON.stringify([]))
    }
  } catch (error) {
    console.error("Error initializing data files:", error)
    throw new Error("Failed to initialize data storage")
  }
}

// Parse an RSS feed from a URL
export async function parseRssFeed(url: string) {
  const parser = new Parser()

  try {
    const feed = await parser.parseURL(url)

    return {
      title: feed.title || "Unnamed Feed",
      description: feed.description || "",
      url: url,
      link: feed.link || url,
      items: feed.items.map((item) => ({
        title: item.title || "Untitled",
        content: item.content || item.contentSnippet || "",
        link: item.link || "",
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      })),
    }
  } catch (error) {
    console.error("Error parsing RSS feed:", error)
    return null
  }
}

// Save a feed and its items
export async function saveFeed(feedData: any) {
  // Add the feed
  const newFeed = await addFeed({
    title: feedData.title,
    description: feedData.description,
    url: feedData.url,
    link: feedData.link,
  })

  // Add the feed items
  await addFeedItems(
    feedData.items.map((item: any) => ({
      feedId: newFeed.id,
      feedTitle: newFeed.title,
      title: item.title,
      content: item.content,
      link: item.link,
      pubDate: item.pubDate,
      isOwn: false,
    })),
  )

  return newFeed
}

// Save a user post to our "database"
export async function savePost(postData: Post) {
  await initDataFiles()

  // Read existing items
  const itemsJson = await fs.readFile(ITEMS_FILE, "utf-8")
  const items: FeedItem[] = JSON.parse(itemsJson)

  // Create new item
  const newItem: FeedItem = {
    id: uuidv4(),
    feedId: "own",
    feedTitle: "Your Feed",
    title: postData.title,
    content: postData.content,
    pubDate: new Date().toISOString(),
    isOwn: true,
  }

  // Add item to items list
  items.push(newItem)
  await fs.writeFile(ITEMS_FILE, JSON.stringify(items, null, 2))
}

// Get all feed items, sorted by date
export async function getFeedItems(): Promise<FeedItem[]> {
  try {
    await initDataFiles()

    const itemsJson = await fs.readFile(ITEMS_FILE, "utf-8")
    let items: FeedItem[] = []

    try {
      items = JSON.parse(itemsJson)
    } catch (parseError) {
      console.error("Error parsing items JSON:", parseError)
      return []
    }

    // Sort by date, newest first
    return items.sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    })
  } catch (error) {
    console.error("Error getting feed items:", error)
    return []
  }
}

// Get all feeds
export async function getFeeds(): Promise<FeedType[]> {
  await initDataFiles()

  try {
    const feedsJson = await fs.readFile(FEEDS_FILE, "utf-8")
    return JSON.parse(feedsJson)
  } catch (error) {
    console.error("Error getting feeds:", error)
    return []
  }
}
