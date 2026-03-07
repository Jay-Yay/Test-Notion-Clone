import { useParams } from 'react-router-dom'
import { useCallback, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/PageHeader'
import NoteEditor from '../components/NoteEditor'
import { usePages } from '../hooks/usePages'
import { Page } from '../types'

export default function AppPage() {
  const { id } = useParams<{ id: string }>()
  const { pages, updatePage } = usePages()
  const page = pages.find(p => p.id === id)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUpdate = useCallback((updates: Partial<Page>) => {
    if (!id) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updatePage(id, updates), 500)
  }, [id, updatePage])

  if (!page) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full text-notion-muted">
        {id ? 'Page not found' : 'Select or create a page'}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <PageHeader page={page} onUpdate={handleUpdate} />
        {page.type === 'note' && <NoteEditor pageId={page.id} />}
      {page.type === 'kanban' && <div className="px-16 text-notion-muted text-sm">Kanban coming soon</div>}
      {page.type === 'table' && <div className="px-16 text-notion-muted text-sm">Table coming soon</div>}
      </div>
    </AppLayout>
  )
}
