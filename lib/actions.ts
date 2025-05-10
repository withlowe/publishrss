"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { addUserPost, getFeeds } from "./db"

export async function subscribeFeed(feedUrl: string) {
  try {
    // Validate the URL
    const url = z.string().url().parse(feedUrl)

    // Check if feed already exists
    const feeds = await getFeeds()
    if (feeds.some((feed) => feed.url === url)) {
      throw new Error("This feed is already in your subscriptions")
    }

    // Fetch the feed from our API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/rss/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch RSS feed")
    }

    const feedData = await response.json()

    // Save the feed to our database
    // This would be implemented in a real database in production
    // For now, we'll use the client-side context

    // Revalidate the feed page
    revalidatePath("/admin")

    return { success: true, feedData }
  } catch (error) {
    console.error("Error subscribing to feed:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to subscribe to feed")
  }
}

export async function createPost(data: { title: string; content: string }) {
  try {
    // Validate the post data
    const postData = z
      .object({
        title: z.string().min(3),
        content: z.string().min(10),
      })
      .parse(data)

    // Save the post to our database
    await addUserPost(postData)

    // Revalidate the feed page
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error creating post:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create post")
  }
}
