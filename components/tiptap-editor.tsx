"use client"

import type React from "react"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Code, ImageIcon } from "lucide-react"
import { useState, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Write your content here...",
}: TiptapEditorProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const addImage = () => {
    if (!editor || !imageUrl) return

    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl,
        alt: imageAlt || "Image",
      })
      .run()

    setImageUrl("")
    setImageAlt("")
    setImagePopoverOpen(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        editor
          .chain()
          .focus()
          .setImage({
            src: dataUrl,
            alt: file.name || "Uploaded image",
          })
          .run()
      }
    }
    reader.readAsDataURL(file)

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-muted/50 p-2 flex flex-wrap gap-1 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-muted" : ""}
        >
          <Code className="h-4 w-4" />
        </Button>

        <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className={editor.isActive("image") ? "bg-muted" : ""}>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  placeholder="Image description"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Upload Image
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <Button type="button" size="sm" onClick={addImage} disabled={!imageUrl}>
                  Add Image
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-grow flex flex-col" onClick={() => editor.chain().focus().run()}>
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none p-4 flex-grow min-h-[300px] overflow-auto cursor-text"
        />
      </div>
    </div>
  )
}
