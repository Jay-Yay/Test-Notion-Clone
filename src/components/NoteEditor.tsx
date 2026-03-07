import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useNoteContent } from '../hooks/useNoteContent'
import { useEffect, useRef } from 'react'

interface Props { pageId: string }

export default function NoteEditor({ pageId }: Props) {
  const { content, saveContent, loading } = useNoteContent(pageId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type '/' for commands…" }),
    ],
    content: content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none outline-none min-h-[200px] text-notion-text dark:text-notion-text-dark',
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => saveContent(editor.getJSON()), 800)
    },
  })

  // Load content into editor once fetched
  useEffect(() => {
    if (!loading && editor && content) {
      editor.commands.setContent(content)
    }
  }, [loading, content, editor])

  if (loading) return <div className="text-notion-muted text-sm">Loading...</div>

  return (
    <div className="px-16">
      <EditorContent editor={editor} />
    </div>
  )
}
