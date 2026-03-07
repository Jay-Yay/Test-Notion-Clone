import { useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { usePages } from '../hooks/usePages'

export default function AppPage() {
  const { id } = useParams<{ id: string }>()
  const { pages } = usePages()
  const page = pages.find(p => p.id === id)

  if (!page) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full text-notion-muted">
        {id ? 'Page not found' : 'Select or create a page'}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-16 py-12">
        <h1 className="text-4xl font-bold text-notion-text dark:text-notion-text-dark mb-4 outline-none">
          {page.title || 'Untitled'}
        </h1>
        <div className="text-notion-muted text-sm">
          {page.type} page — editor coming soon
        </div>
      </div>
    </AppLayout>
  )
}
