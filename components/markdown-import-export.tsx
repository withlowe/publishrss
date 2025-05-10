"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFeeds } from "./feed-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

export default function MarkdownImportExport() {
  const { exportPostsAsMarkdown, importMarkdownPosts, exportPostsAsMarkdownZip } = useFeeds()
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [zipExportSuccess, setZipExportSuccess] = useState(false)
  const [includePrivate, setIncludePrivate] = useState(true)
  const [includeFrontmatter, setIncludeFrontmatter] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExportMarkdown = () => {
    try {
      exportPostsAsMarkdown(includePrivate, includeFrontmatter)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 2000)

      toast({
        title: "Post exported",
        description: "Your post has been exported as a markdown file",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export post",
        variant: "destructive",
      })
    }
  }

  const handleExportMarkdownZip = async () => {
    try {
      await exportPostsAsMarkdownZip(includePrivate, includeFrontmatter)
      setZipExportSuccess(true)
      setTimeout(() => setZipExportSuccess(false), 2000)

      toast({
        title: "Posts exported",
        description: "Your posts have been exported as a zip archive of markdown files",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export posts",
        variant: "destructive",
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleZipImportClick = () => {
    zipInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setImportError(null)
    setIsImporting(true)
    setImportSuccess(false)

    try {
      let importedCount = 0

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Check if it's a markdown file
        if (!file.name.toLowerCase().endsWith(".md")) {
          continue
        }

        const reader = new FileReader()

        // Use a promise to handle the async file reading
        const fileContent = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => {
            resolve((event.target?.result as string) || "")
          }
          reader.onerror = () => {
            reject(new Error(`Error reading file: ${file.name}`))
          }
          reader.readAsText(file)
        })

        // Import the markdown content
        const result = await importMarkdownPosts(fileContent, file.name)
        importedCount += result.imported
      }

      if (importedCount > 0) {
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 2000)

        toast({
          title: "Posts imported",
          description: `Successfully imported ${importedCount} posts from markdown`,
        })
      } else {
        throw new Error("No valid markdown posts found in the selected files")
      }

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Invalid file format")

      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import posts",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleZipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setIsImporting(true)
    setImportSuccess(false)

    try {
      // Check if it's a zip file
      if (!file.name.toLowerCase().endsWith(".zip")) {
        throw new Error("Please select a ZIP file")
      }

      const reader = new FileReader()

      // Use a promise to handle the async file reading
      const fileContent = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = (event) => {
          resolve(event.target?.result as ArrayBuffer)
        }
        reader.onerror = () => {
          reject(new Error(`Error reading ZIP file: ${file.name}`))
        }
        reader.readAsArrayBuffer(file)
      })

      // Import the zip content
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(fileContent)

      let importedCount = 0

      // Process each file in the zip
      const promises = Object.keys(zipContent.files).map(async (filename) => {
        if (!filename.toLowerCase().endsWith(".md")) {
          return 0
        }

        const zipEntry = zipContent.files[filename]
        if (zipEntry.dir) {
          return 0
        }

        const content = await zipEntry.async("string")
        const result = await importMarkdownPosts(content, filename)
        return result.imported
      })

      const results = await Promise.all(promises)
      importedCount = results.reduce((sum, count) => sum + count, 0)

      if (importedCount > 0) {
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 2000)

        toast({
          title: "Posts imported",
          description: `Successfully imported ${importedCount} posts from ZIP archive`,
        })
      } else {
        throw new Error("No valid markdown posts found in the ZIP archive")
      }

      // Reset the file input
      if (zipInputRef.current) {
        zipInputRef.current.value = ""
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Invalid ZIP file")

      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import posts from ZIP",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Markdown Import/Export</CardTitle>
        <CardDescription>Export posts as markdown files or import from markdown</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="export" className="flex-1">
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-private"
                  checked={includePrivate}
                  onCheckedChange={(checked) => setIncludePrivate(checked as boolean)}
                />
                <Label htmlFor="include-private">Include private posts</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-frontmatter"
                  checked={includeFrontmatter}
                  onCheckedChange={(checked) => setIncludeFrontmatter(checked as boolean)}
                />
                <Label htmlFor="include-frontmatter">Include YAML frontmatter</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Button onClick={handleExportMarkdown} className="w-full" variant="outline">
                  {exportSuccess ? "Exported" : "Export Post"}
                </Button>

                <Button onClick={handleExportMarkdownZip} className="w-full" variant="outline">
                  {zipExportSuccess ? "Exported" : "Export as ZIP"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Import Markdown Files</Label>
                <p className="text-sm text-muted-foreground">Import one or more markdown files</p>
                <Button onClick={handleImportClick} className="w-full" variant="outline" disabled={isImporting}>
                  {importSuccess ? "Imported" : isImporting ? "Importing..." : "Import MD"}
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
              </div>

              <div className="space-y-2">
                <Label>Import ZIP Archive</Label>
                <p className="text-sm text-muted-foreground">Import a ZIP file containing markdown files</p>
                <Button onClick={handleZipImportClick} className="w-full" variant="outline" disabled={isImporting}>
                  {importSuccess ? "Imported" : isImporting ? "Importing..." : "Import ZIP"}
                </Button>
                <Input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipFileChange} className="hidden" />
              </div>
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
          <p className="font-medium mb-1">About Markdown Export/Import:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Markdown files preserve your post content and metadata</li>
            <li>Frontmatter includes title, date, and privacy status</li>
            <li>Compatible with most static site generators</li>
            <li>ZIP export creates a file for each post with proper filenames</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
