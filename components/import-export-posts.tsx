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

export default function ImportExportPosts() {
  const { exportPosts, importPosts } = useFeeds()
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExport = () => {
    try {
      exportPosts()
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 2000)

      toast({
        title: "Posts exported",
        description: "Your posts have been exported to a JSON file",
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setIsImporting(true)
    setImportSuccess(false)

    try {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string
          await importPosts(content)

          setImportSuccess(true)
          setTimeout(() => setImportSuccess(false), 2000)

          toast({
            title: "Posts imported",
            description: "Your posts have been imported successfully",
          })

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

      reader.onerror = () => {
        setImportError("Error reading file")
        setIsImporting(false)

        toast({
          title: "Import failed",
          description: "Error reading file",
          variant: "destructive",
        })
      }

      reader.readAsText(file)
    } catch (error) {
      setImportError("Error processing file")
      setIsImporting(false)

      toast({
        title: "Import failed",
        description: "Error processing file",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import/Export Posts</CardTitle>
        <CardDescription>Backup your posts or move them between instances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Export Posts</Label>
            <p className="text-sm text-muted-foreground">
              Download all your posts as a JSON file that you can backup or import later.
            </p>
            <Button onClick={handleExport} className="w-full" variant="outline">
              {exportSuccess ? "Exported" : "Export Posts"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Import Posts</Label>
            <p className="text-sm text-muted-foreground">Import posts from a previously exported JSON file.</p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleImportClick} className="w-full" variant="outline" disabled={isImporting}>
                {importSuccess ? "Imported" : isImporting ? "Importing..." : "Import Posts"}
              </Button>
              <Input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
        </div>

        {importError && (
          <Alert variant="destructive">
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
          <p className="font-medium mb-1">Note:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Exported files contain only your own posts, not subscribed feeds</li>
            <li>Both public and private posts are included in exports</li>
            <li>When importing, duplicate posts will be skipped</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
