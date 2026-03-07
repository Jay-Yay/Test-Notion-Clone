import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'
import { KanbanCard as KanbanCardType } from '../types'

interface Props {
  card: KanbanCardType
  onDelete: (id: string) => void
}

export default function KanbanCard({ card, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 text-sm text-notion-text dark:text-notion-text-dark shadow-sm cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span>{card.title || 'Untitled'}</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(card.id) }}
          className="hidden group-hover:block text-notion-muted hover:text-red-500 flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {card.description && <p className="mt-1 text-notion-muted text-xs">{card.description}</p>}
    </div>
  )
}
