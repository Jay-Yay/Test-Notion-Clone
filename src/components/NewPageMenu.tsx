import { FileText, Columns, Table } from 'lucide-react'
import { PageType } from '../types'

interface Props {
  onSelect: (type: PageType) => void
  onClose: () => void
}

export default function NewPageMenu({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-10 left-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 w-48">
      <p className="px-3 py-1 text-xs font-medium text-notion-muted uppercase tracking-wide">New page</p>
      {([
        { type: 'note' as PageType, label: 'Note', icon: <FileText className="w-4 h-4" /> },
        { type: 'kanban' as PageType, label: 'Kanban board', icon: <Columns className="w-4 h-4" /> },
        { type: 'table' as PageType, label: 'Table', icon: <Table className="w-4 h-4" /> },
      ]).map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose() }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}
