import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Trash2 } from 'lucide-react'
import { KanbanColumn as KanbanColumnType, KanbanCard } from '../types'
import KanbanCardComponent from './KanbanCard'

interface Props {
  column: KanbanColumnType
  cards: KanbanCard[]
  onAddCard: (columnId: string) => void
  onDeleteCard: (cardId: string) => void
  onDeleteColumn: (columnId: string) => void
}

export default function KanbanColumn({ column, cards, onAddCard, onDeleteCard, onDeleteColumn }: Props) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div className="flex-shrink-0 w-64 flex flex-col bg-notion-sidebar dark:bg-notion-sidebar-dark rounded-lg">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-notion-text dark:text-notion-text-dark">{column.title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onAddCard(column.id)} className="text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark p-0.5 rounded">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => onDeleteColumn(column.id)} className="text-notion-muted hover:text-red-500 p-0.5 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={setNodeRef} className="flex-1 px-2 pb-2 space-y-2 min-h-[100px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCardComponent key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
