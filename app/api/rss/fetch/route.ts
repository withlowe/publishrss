import { NextResponse } from "next/server"
import Parser from "rss-parser"

// Define types for our RSS feed response
type FeedResponse = {
  title: string
  description: string
  link: string
  items: {
    title: string
    content: string
    contentSnippet?: string
    link?: string
    pubDate: string
  }[]
}

export async function POST(request: Request) {
  try {
    // Get the feed URL from the request body
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Feed URL is required" }, { status: 400 })
    }

    // Create a new parser instance
    const parser = new Parser({
      customFields: {
        item: [
          ["content:encoded", "content"],
          ["description", "description"],
        ],
      },
    })

    // Fetch and parse the feed
    const feed = await parser.parseURL(url)

    // Format the response
    const response: FeedResponse = {
      title: feed.title || "Unnamed Feed",
      description: feed.description || "",
      link: feed.link || url,
      items: feed.items.map((item) => ({
        title: item.title || "Untitled",
        content: item.content || item.contentSnippet || item.description || "",
        contentSnippet: item.contentSnippet || "",
        link: item.link || "",
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      })),
    }

    // Return the parsed feed
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching RSS feed:", error)

    // Return an appropriate error response
    return NextResponse.json({ error: "Failed to fetch or parse the RSS feed" }, { status: 500 })
  }
}
