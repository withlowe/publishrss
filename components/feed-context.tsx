"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Types
export type FeedItem = {
  id: string
  title: string
  feedTitle: string
  content: string
  link?: string
  pubDate: string
  isOwn: boolean
  isPrivate?: boolean
}

export type Feed = {
  id: string
  title: string
  url: string
}

type FeedContextType = {
  feeds: Feed[]
  feedItems: FeedItem[]
  addFeed: (url: string) => Promise<void>
  deleteFeed: (id: string) => void
  addPost: (content: string, isPrivate: boolean) => void
  deletePost: (id: string) => void
  exportFeeds: () => void
  importFeeds: (jsonData: string) => void
  getYourFeedUrl: () => string
  getYourPrivateFeedUrl: () => string
  subscribeToYourFeed: () => Promise<void>
  subscribeToYourPrivateFeed: () => Promise<void>
  getYourPosts: () => FeedItem[]
  getPublicPosts: () => FeedItem[]
  getPrivatePosts: () => FeedItem[]
  isLoading: boolean
}

// Initial sample data
const INITIAL_FEEDS: Feed[] = [
  {
    id: "sample-feed",
    title: "Your Feed",
    url: "local",
  },
]

const INITIAL_FEED_ITEMS: FeedItem[] = [
  {
    id: "1",
    title: "Welcome to your RSS Reader",
    feedTitle: "Your Feed",
    content: "<p>This is a sample post to get you started. Subscribe to RSS feeds or create your own posts!</p>",
    pubDate: new Date().toISOString(),
    isOwn: true,
    isPrivate: false,
  },
  {
    id: "2",
    title: "How to Use This RSS Reader",
    feedTitle: "Your Feed",
    content: "<p>Use the 'Subscribe' tab to add RSS feeds, and the 'Create Post' tab to publish your own content.</p>",
    pubDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isOwn: true,
    isPrivate: false,
  },
]

// Create context
const FeedContext = createContext<FeedContextType | undefined>(undefined)

// Provider component
export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [feeds, setFeeds] = useState<Feed[]>(INITIAL_FEEDS)
  const [feedItems, setFeedItems] = useState<FeedItem[]>(INITIAL_FEED_ITEMS)
  const [isLoading, setIsLoading] = useState(false)
  const [privateTokens, setPrivateTokens] = useState<Record<string, string>>({})

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const savedFeeds = localStorage.getItem("rss-feeds")
      const savedItems = localStorage.getItem("rss-items")
      const savedTokens = localStorage.getItem("rss-private-tokens")

      if (savedFeeds) {
        setFeeds(JSON.parse(savedFeeds))
      }

      if (savedItems) {
        setFeedItems(JSON.parse(savedItems))
      }

      if (savedTokens) {
        setPrivateTokens(JSON.parse(savedTokens))
      } else {
        // Generate a private token if none exists
        const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        setPrivateTokens({ default: newToken })
        localStorage.setItem("rss-private-tokens", JSON.stringify({ default: newToken }))
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("rss-feeds", JSON.stringify(feeds))
      localStorage.setItem("rss-items", JSON.stringify(feedItems))
      localStorage.setItem("rss-private-tokens", JSON.stringify(privateTokens))
    } catch (error) {
      console.error("Error saving data to localStorage:", error)
    }
  }, [feeds, feedItems, privateTokens])

  // Add a new feed
  const addFeed = async (url: string) => {
    // Check if feed already exists
    if (feeds.some((feed) => feed.url === url)) {
      throw new Error("This feed is already in your subscriptions")
    }

    setIsLoading(true)

    try {
      // Fetch the feed from our API route
      const response = await fetch("/api/rss/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch RSS feed")
      }

      const feedData = await response.json()

      // Generate a random ID
      const id = Math.random().toString(36).substring(2, 9)

      // Add the feed
      const newFeed: Feed = {
        id,
        title: feedData.title || url,
        url,
      }

      setFeeds((prev) => [...prev, newFeed])

      // Add the feed items
      const newItems: FeedItem[] = feedData.items.map((item: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        feedId: id,
        feedTitle: feedData.title,
        title: item.title,
        content: item.content,
        link: item.link,
        pubDate: item.pubDate,
        isOwn: false,
      }))

      setFeedItems((prev) => [...newItems, ...prev])
      return newFeed
    } catch (error) {
      console.error("Error adding feed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a feed
  const deleteFeed = (id: string) => {
    setFeeds((prev) => prev.filter((feed) => feed.id !== id))
    setFeedItems((prev) =>
      prev.filter((item) => !(item.feedTitle === feeds.find((feed) => feed.id === id)?.title && !item.isOwn)),
    )
  }

  // Add a new post
  const addPost = (content: string, isPrivate = false) => {
    // Generate a title from the content by extracting the first few words
    const textContent = content.replace(/<[^>]*>/g, "")
    const titlePreview = textContent.split(" ").slice(0, 5).join(" ")
    const title =
      titlePreview.length > 0
        ? `${titlePreview}${titlePreview.length < textContent.length ? "..." : ""}`
        : "Untitled Post"

    const newPost: FeedItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      feedTitle: isPrivate ? "Your Private Feed" : "Your Feed",
      content,
      pubDate: new Date().toISOString(),
      isOwn: true,
      isPrivate,
    }

    setFeedItems((prev) => [newPost, ...prev])
  }

  // Delete a post
  const deletePost = (id: string) => {
    setFeedItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Get all your posts (both public and private)
  const getYourPosts = () => {
    return feedItems.filter((item) => item.isOwn)
  }

  // Get only your public posts
  const getPublicPosts = () => {
    return feedItems.filter((item) => item.isOwn && !item.isPrivate)
  }

  // Get only your private posts
  const getPrivatePosts = () => {
    return feedItems.filter((item) => item.isOwn && item.isPrivate)
  }

  // Export feeds as JSON
  const exportFeeds = () => {
    const exportData = {
      feeds,
      items: feedItems.filter((item) => item.isOwn), // Only export your own posts
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `rss-feeds-export-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Import feeds from JSON
  const importFeeds = (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData)

      if (importedData.feeds && Array.isArray(importedData.feeds)) {
        // Merge imported feeds with existing feeds, avoiding duplicates
        const newFeeds = [...feeds]

        importedData.feeds.forEach((importedFeed: Feed) => {
          if (!feeds.some((feed) => feed.url === importedFeed.url)) {
            newFeeds.push({
              ...importedFeed,
              id: Math.random().toString(36).substring(2, 9), // Generate new ID
            })
          }
        })

        setFeeds(newFeeds)
      }

      if (importedData.items && Array.isArray(importedData.items)) {
        // Merge imported items with existing items, avoiding duplicates
        const newItems = [...feedItems]

        importedData.items.forEach((importedItem: FeedItem) => {
          if (!feedItems.some((item) => item.title === importedItem.title && item.pubDate === importedItem.pubDate)) {
            newItems.push({
              ...importedItem,
              id: Math.random().toString(36).substring(2, 9), // Generate new ID
            })
          }
        })

        setFeedItems(newItems)
      }
    } catch (error) {
      console.error("Error importing feeds:", error)
      throw new Error("Invalid JSON format")
    }
  }

  // Get your public feed's RSS URL
  const getYourFeedUrl = () => {
    const host = window.location.host
    return `${window.location.protocol}//${host}/api/rss/your-feed`
  }

  // Get your private feed's RSS URL
  const getYourPrivateFeedUrl = () => {
    const host = window.location.host
    const token =
      privateTokens.default || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    return `${window.location.protocol}//${host}/api/rss/private-feed?token=${token}`
  }

  // Subscribe to your own public feed
  const subscribeToYourFeed = async () => {
    const url = getYourFeedUrl()
    await addFeed(url)
  }

  // Subscribe to your own private feed
  const subscribeToYourPrivateFeed = async () => {
    const url = getYourPrivateFeedUrl()
    await addFeed(url)
  }

  return (
    <FeedContext.Provider
      value={{
        feeds,
        feedItems,
        addFeed,
        deleteFeed,
        addPost,
        deletePost,
        exportFeeds,
        importFeeds,
        getYourFeedUrl,
        getYourPrivateFeedUrl,
        subscribeToYourFeed,
        subscribeToYourPrivateFeed,
        getYourPosts,
        getPublicPosts,
        getPrivatePosts,
        isLoading,
      }}
    >
      {children}
    </FeedContext.Provider>
  )
}

// Custom hook to use the feed context
export function useFeeds() {
  const context = useContext(FeedContext)
  if (context === undefined) {
    throw new Error("useFeeds must be used within a FeedProvider")
  }
  return context
}
