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
  exportPosts: () => void
  importPosts: () => void
  exportPostsAsMarkdown: (includePrivate: boolean, includeFrontmatter: boolean) => void
  exportPostsAsMarkdownZip: (includePrivate: boolean, includeFrontmatter: boolean) => Promise<void>
  importMarkdownPosts: (markdownContent: string, filename: string) => Promise<{ imported: number }>
  getYourFeedUrl: () => string
  getYourPrivateFeedUrl: () => string
  subscribeToYourFeed: () => Promise<void>
  subscribeToYourPrivateFeed: () => Promise<void>
  getYourPosts: () => FeedItem[]
  getPublicPosts: () => FeedItem[]
  getPrivatePosts: () => FeedItem[]
  refreshFeeds: () => Promise<number>
  isLoading: boolean
  isRefreshing: boolean
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
  const [isRefreshing, setIsRefreshing] = useState(false)
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

  // Refresh all feeds
  const refreshFeeds = async () => {
    setIsRefreshing(true)
    let newItemsCount = 0

    try {
      // Get all external feeds (exclude local/own feeds)
      const externalFeeds = feeds.filter((feed) => feed.url !== "local")

      // Process each feed
      for (const feed of externalFeeds) {
        try {
          // Fetch the feed from our API route
          const response = await fetch("/api/rss/fetch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: feed.url }),
          })

          if (!response.ok) {
            console.error(`Failed to refresh feed: ${feed.title}`)
            continue
          }

          const feedData = await response.json()

          // Process each item in the feed
          for (const item of feedData.items) {
            // Check if this item already exists (by title and link)
            const existingItem = feedItems.find(
              (existing) => existing.feedId === feed.id && existing.title === item.title && existing.link === item.link,
            )

            // If item doesn't exist, add it
            if (!existingItem) {
              const newItem: FeedItem = {
                id: Math.random().toString(36).substring(2, 9),
                feedId: feed.id,
                feedTitle: feed.title,
                title: item.title,
                content: item.content,
                link: item.link,
                pubDate: item.pubDate,
                isOwn: false,
              }

              setFeedItems((prev) => [newItem, ...prev])
              newItemsCount++
            }
          }
        } catch (error) {
          console.error(`Error refreshing feed ${feed.title}:`, error)
        }
      }

      return newItemsCount
    } catch (error) {
      console.error("Error refreshing feeds:", error)
      throw error
    } finally {
      setIsRefreshing(false)
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
      items: feedItems.filter((item) => !item.isOwn), // Only export subscribed feeds
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `rss-feeds-export-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Export posts as JSON
  const exportPosts = () => {
    const exportData = {
      posts: feedItems.filter((item) => item.isOwn), // Only export your own posts
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `rss-posts-export-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Export posts as Markdown
  const exportPostsAsMarkdown = async (includePrivate = true, includeFrontmatter = true) => {
    try {
      // Dynamically import the TurndownService
      const { default: TurndownService } = await import("turndown")
      const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        emDelimiter: "*",
      })

      // Get the posts to export
      const postsToExport = feedItems.filter((item) => item.isOwn && (includePrivate || !item.isPrivate))

      if (postsToExport.length === 0) {
        throw new Error("No posts to export")
      }

      // Get the most recent post
      const post = postsToExport[0]

      // Convert HTML to Markdown
      const markdown = turndownService.turndown(post.content)

      // Create frontmatter if requested
      let fileContent = ""
      if (includeFrontmatter) {
        fileContent += `---
title: "${post.title.replace(/"/g, '\\"')}"
date: ${new Date(post.pubDate).toISOString()}
private: ${post.isPrivate ? "true" : "false"}
---

`
      }

      fileContent += markdown

      // Create a safe filename
      const safeTitle = post.title
        .replace(/[^a-z0-9]/gi, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
      const dateStr = new Date(post.pubDate).toISOString().split("T")[0]
      const filename = `${dateStr}-${safeTitle}.md`

      // Download the file
      const blob = new Blob([fileContent], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting posts as markdown:", error)
      throw error
    }
  }

  // Export all posts as a ZIP of Markdown files
  const exportPostsAsMarkdownZip = async (includePrivate = true, includeFrontmatter = true) => {
    try {
      // Dynamically import the required libraries
      const [{ default: TurndownService }, { default: JSZip }] = await Promise.all([
        import("turndown"),
        import("jszip"),
      ])

      const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        emDelimiter: "*",
      })

      // Get the posts to export
      const postsToExport = feedItems.filter((item) => item.isOwn && (includePrivate || !item.isPrivate))

      if (postsToExport.length === 0) {
        throw new Error("No posts to export")
      }

      // Create a new ZIP file
      const zip = new JSZip()

      // Add each post as a markdown file
      postsToExport.forEach((post) => {
        // Convert HTML to Markdown
        const markdown = turndownService.turndown(post.content)

        // Create frontmatter if requested
        let fileContent = ""
        if (includeFrontmatter) {
          fileContent += `---
title: "${post.title.replace(/"/g, '\\"')}"
date: ${new Date(post.pubDate).toISOString()}
private: ${post.isPrivate ? "true" : "false"}
---

`
        }

        fileContent += markdown

        // Create a safe filename
        const safeTitle = post.title
          .replace(/[^a-z0-9]/gi, "-")
          .replace(/-+/g, "-")
          .toLowerCase()
        const dateStr = new Date(post.pubDate).toISOString().split("T")[0]
        const filename = `${dateStr}-${safeTitle}.md`

        // Add the file to the ZIP
        zip.file(filename, fileContent)
      })

      // Generate the ZIP file
      const content = await zip.generateAsync({ type: "blob" })

      // Download the ZIP file
      const url = URL.createObjectURL(content)
      const link = document.createElement("a")
      link.href = url
      link.download = `posts-export-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting posts as markdown zip:", error)
      throw error
    }
  }

  // Import markdown posts
  const importMarkdownPosts = async (markdownContent: string, filename: string) => {
    try {
      // Check if it's a markdown file
      if (!filename.toLowerCase().endsWith(".md")) {
        return { imported: 0 }
      }

      // Parse frontmatter if present
      let title = ""
      let pubDate = new Date().toISOString()
      let isPrivate = false
      let content = markdownContent

      // Check for frontmatter
      const frontmatterMatch = markdownContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1]

        // Extract title
        const titleMatch = frontmatter.match(/title:\s*"?(.*?)"?\s*\n/)
        if (titleMatch) {
          title = titleMatch[1]
        }

        // Extract date
        const dateMatch = frontmatter.match(/date:\s*(.*?)\s*\n/)
        if (dateMatch) {
          try {
            pubDate = new Date(dateMatch[1]).toISOString()
          } catch (e) {
            // If date parsing fails, use current date
            pubDate = new Date().toISOString()
          }
        }

        // Extract private flag
        const privateMatch = frontmatter.match(/private:\s*(true|false)\s*\n/)
        if (privateMatch) {
          isPrivate = privateMatch[1] === "true"
        }

        // Remove frontmatter from content
        content = markdownContent.substring(frontmatterMatch[0].length)
      }

      // If no title was found in frontmatter, extract from filename
      if (!title) {
        // Try to extract title from filename (format: YYYY-MM-DD-title.md)
        const filenameMatch = filename.match(/\d{4}-\d{2}-\d{2}-(.*?)\.md$/)
        if (filenameMatch) {
          title = filenameMatch[1].replace(/-/g, " ")
          // Capitalize first letter of each word
          title = title.replace(/\b\w/g, (l) => l.toUpperCase())
        } else {
          // Use filename without extension as title
          title = filename.replace(/\.md$/, "").replace(/-/g, " ")
        }
      }

      // Convert markdown to HTML
      const { unified } = await import("unified")
      const { default: remarkParse } = await import("remark-parse")
      const { default: remarkRehype } = await import("remark-rehype")
      const { default: rehypeStringify } = await import("rehype-stringify")

      const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify)

      const htmlContent = String(await processor.process(content))

      // Check if this post already exists (by title and content similarity)
      const isDuplicate = feedItems.some((item) => {
        // Check if titles are similar
        const titleSimilarity = item.title.toLowerCase() === title.toLowerCase()

        // If titles match, check content similarity
        if (titleSimilarity) {
          // Simple content comparison - could be improved
          const existingText = item.content.replace(/<[^>]*>/g, "").trim()
          const newText = htmlContent.replace(/<[^>]*>/g, "").trim()

          // Check if content is similar (more than 80% similar)
          const maxLength = Math.max(existingText.length, newText.length)
          let sameChars = 0
          const minLength = Math.min(existingText.length, newText.length)

          for (let i = 0; i < minLength; i++) {
            if (existingText[i] === newText[i]) {
              sameChars++
            }
          }

          const similarity = sameChars / maxLength
          return similarity > 0.8
        }

        return false
      })

      if (isDuplicate) {
        return { imported: 0 }
      }

      // Create a new post
      const newPost: FeedItem = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        feedTitle: isPrivate ? "Your Private Feed" : "Your Feed",
        content: htmlContent,
        pubDate,
        isOwn: true,
        isPrivate,
      }

      // Add the post
      setFeedItems((prev) => [newPost, ...prev])

      return { imported: 1 }
    } catch (error) {
      console.error("Error importing markdown post:", error)
      throw error
    }
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

  // Import posts from JSON
  const importPosts = (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData)

      if (importedData.posts && Array.isArray(importedData.posts)) {
        // Import posts
        let importedCount = 0

        importedData.posts.forEach((importedPost: FeedItem) => {
          // Check for duplicates by comparing title and content
          const isDuplicate = feedItems.some(
            (item) => item.title === importedPost.title && item.content === importedPost.content,
          )

          if (!isDuplicate) {
            const newPost = {
              ...importedPost,
              id: Math.random().toString(36).substring(2, 9), // Generate new ID
              isOwn: true, // Ensure it's marked as own
              pubDate: importedPost.pubDate || new Date().toISOString(), // Use original date or current
            }
            setFeedItems((prev) => [newPost, ...prev])
            importedCount++
          }
        })

        if (importedCount === 0) {
          throw new Error("No new posts to import (all posts already exist)")
        }
      } else {
        throw new Error("No posts found in the import file")
      }
    } catch (error) {
      console.error("Error importing posts:", error)
      throw error
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
        exportPosts,
        importPosts,
        exportPostsAsMarkdown,
        exportPostsAsMarkdownZip,
        importMarkdownPosts,
        getYourFeedUrl,
        getYourPrivateFeedUrl,
        subscribeToYourFeed,
        subscribeToYourPrivateFeed,
        getYourPosts,
        getPublicPosts,
        getPrivatePosts,
        refreshFeeds,
        isLoading,
        isRefreshing,
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
