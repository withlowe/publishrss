import { NextResponse } from "next/server"
import { getFeedItems } from "@/lib/db"

export async function GET() {
  try {
    // Get all feed items
    const allItems = await getFeedItems()

    // Filter to only include public posts that are owned by the user
    const publicPosts = allItems.filter((item) => item.isOwn && !item.isPrivate)

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Your PublishRSS Feed</title>
  <link>${process.env.NEXT_PUBLIC_APP_URL || "https://your-site.com"}</link>
  <description>Your personal RSS feed</description>
  ${publicPosts
    .map(
      (post) => `
  <item>
    <title>${escapeXml(post.title)}</title>
    <description><![CDATA[${post.content}]]></description>
    <pubDate>${new Date(post.pubDate).toUTCString()}</pubDate>
    <guid>${post.id}</guid>
  </item>
  `,
    )
    .join("")}
</channel>
</rss>`

    // Return the RSS feed with the appropriate content type
    return new NextResponse(rssXml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error generating RSS feed:", error)
    return NextResponse.json({ error: "Failed to generate RSS feed" }, { status: 500 })
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case "&":
        return "&amp;"
      case "'":
        return "&apos;"
      case '"':
        return "&quot;"
      default:
        return c
    }
  })
}
