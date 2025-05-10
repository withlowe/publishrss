"use client"

import { useState } from "react"
import { useFeeds } from "./feed-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NowPage() {
  const { getPublicPosts, getYourFeedUrl } = useFeeds()
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const publicPosts = getPublicPosts().slice(0, 5) // Get latest 5 public posts
  const feedUrl = getYourFeedUrl()

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get current date for the NOW page
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Generate the NOW page HTML
  const generateNowPageHtml = () => {
    const postsHtml = publicPosts
      .map(
        (post) => `
      <div class="post">
        <h3>${post.title}</h3>
        <div class="post-meta">${formatDate(post.pubDate)}</div>
        <div class="post-content">
          ${post.content}
        </div>
      </div>
    `,
      )
      .join("\n")

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Now Page</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 650px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    
    a {
      color: #0070f3;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    /* Header styles */
    header {
      margin-bottom: 2rem;
      text-align: center;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    .updated {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    
    /* Intro styles */
    .intro {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eaeaea;
    }
    
    /* Posts styles */
    .posts {
      margin-bottom: 2rem;
    }
    
    .post {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eaeaea;
    }
    
    h2 {
      font-size: 1.8rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #eaeaea;
    }
    
    h3 {
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
    }
    
    .post-meta {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .post-content {
      margin-bottom: 1rem;
    }
    
    /* Footer styles */
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #eaeaea;
      text-align: center;
      font-size: 0.9rem;
      color: #666;
    }
    
    .subscribe {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 5px;
      text-align: center;
    }
    
    /* Responsive adjustments */
    @media (max-width: 600px) {
      h1 {
        font-size: 2rem;
      }
      
      h2 {
        font-size: 1.5rem;
      }
      
      h3 {
        font-size: 1.2rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Now</h1>
    <div class="updated">Last updated: ${currentDate}</div>
  </header>
  
  <section class="intro">
  </section>
  
  <section class="posts">
    <h2>Latest Updates</h2>
    ${postsHtml}
  </section>
  
  <div class="subscribe">
    <p>Want to stay updated? Subscribe to my RSS feed:</p>
    <p><a href="${feedUrl}" target="_blank">${feedUrl}</a></p>
  </div>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()}</p>
  </footer>
</body>
</html>`
  }

  const handleCopyHtml = async () => {
    try {
      const html = generateNowPageHtml()
      await navigator.clipboard.writeText(html)
      setCopied(true)

      toast({
        title: "HTML copied",
        description: "NOW page HTML has been copied to clipboard",
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the HTML to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">NOW Page</h2>
        <Button onClick={handleCopyHtml} className="flex items-center gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy HTML
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is a NOW page?</CardTitle>
          <CardDescription>
            A NOW page tells visitors what you're focused on at this point in your life. It's a snapshot of your current
            projects, interests, and priorities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The NOW page concept was started by{" "}
            <a
              href="https://sive.rs/nowff"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 inline-flex"
            >
              Derek Sivers <ExternalLink className="h-3 w-3" />
            </a>{" "}
            and has become a popular way for people to share what they're currently doing.
          </p>
          <p>
            This generator creates a simple, clean NOW page based on your latest public posts. You can copy the HTML and
            host it anywhere.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="preview">
        <TabsList className="w-full">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="instructions">How to Use</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <Card className="border-2">
            <CardContent className="p-0">
              <div className="w-full bg-white rounded-md overflow-hidden">
                <iframe
                  srcDoc={generateNowPageHtml()}
                  title="NOW Page Preview"
                  className="w-full h-[600px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>How to Use Your NOW Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Copy the HTML</h3>
                <p>Click the "Copy HTML" button at the top of this page to copy the complete HTML code.</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">2. Host the Page</h3>
                <p>You have several options for hosting your NOW page:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Save it as an "index.html" file in a "/now" directory on your website</li>
                  <li>Use a service like GitHub Pages, Netlify, or Vercel to host the HTML file</li>
                  <li>Paste the HTML into a code block in your CMS if it supports raw HTML</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">3. Link to Your NOW Page</h3>
                <p>
                  Add a link to your NOW page in your website navigation, social media profiles, or email signature.
                  Typically, NOW pages are linked as "/now" on your domain.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">4. Keep it Updated</h3>
                <p>
                  Your NOW page automatically includes your 5 most recent public posts. To keep it fresh, simply create
                  new posts in PublishRSS and regenerate your NOW page.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">5. Join the Movement</h3>
                <p>
                  Consider adding your NOW page to the{" "}
                  <a
                    href="https://nownownow.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    NowNowNow directory
                  </a>{" "}
                  to join thousands of others who maintain NOW pages.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
