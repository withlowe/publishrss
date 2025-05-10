"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFeeds } from "./feed-context"
import { Trash2, Upload, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ManageFeeds() {
  const { feeds, deleteFeed, exportFeeds, importFeeds } = useFeeds()
  const { toast } = useToast()
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleDeleteFeed = (id: string, title: string) => {
    deleteFeed(id)
    toast({
      title: "Feed deleted",
      description: `"${title}" has been removed from your subscriptions.`,
    })
  }

  const handleExport = () => {
    exportFeeds()
    toast({
      title: "Feeds exported",
      description: "Your feeds have been exported to a JSON file.",
    })
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a JSON file to import.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      const fileContent = await importFile.text()
      importFeeds(fileContent)

      toast({
        title: "Feeds imported",
        description: "Your feeds have been imported successfully.",
      })

      setImportDialogOpen(false)
      setImportFile(null)
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import feeds",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Feeds</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Feeds</DialogTitle>
                <DialogDescription>Upload a JSON file containing feeds to import.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="importFile">Select File</Label>
                  <Input
                    id="importFile"
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!importFile || isImporting}>
                  {isImporting ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {feeds.length <= 1 ? (
        <div className="text-center p-4 border rounded-lg">
          <p className="text-muted-foreground">No external feeds subscribed yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feeds.map(
            (feed) =>
              feed.id !== "sample-feed" && (
                <div key={feed.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{feed.title}</h4>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">{feed.url}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteFeed(feed.id, feed.title)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  )
}
