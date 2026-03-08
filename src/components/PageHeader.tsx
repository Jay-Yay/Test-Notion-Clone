import { useState, useEffect } from 'react'
import { Page } from '../types'

interface Props {
  page: Page
  onUpdate: (updates: Partial<Page>) => void
}

export default function PageHeader({ page, onUpdate }: Props) {
  const [title, setTitle] = useState(page.title ?? '')

  useEffect(() => {
    setTitle(page.title ?? '')
  }, [page.id])

  return (
    <div className="px-16 pt-16 pb-4">
      {page.icon && <div className="text-6xl mb-4">{page.icon}</div>}
      <input
        className="w-full text-4xl font-bold text-notion-text dark:text-notion-text-dark bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-600"
        value={title}
        placeholder="Untitled"
        onChange={e => { setTitle(e.target.value); onUpdate({ title: e.target.value }) }}
      />
    </div>
  )
}
