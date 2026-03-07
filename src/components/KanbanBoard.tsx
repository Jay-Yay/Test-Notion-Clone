import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useKanban } from '../hooks/useKanban'
import KanbanColumnComponent from './KanbanColumn'

interface Props { pageId: string }

export default function KanbanBoard({ pageId }: Props) {
  const { columns, cards, loading, addColumn, addCard, moveCard, deleteCard, deleteColumn } = useKanban(pageId)
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const targetColumn = columns.find(c => c.id === over.id) ?? columns.find(c => cards.some(card => card.id === over.id && card.column_id === c.id))
    if (!targetColumn) return
    const colCards = cards.filter(c => c.column_id === targetColumn.id)
    moveCard(active.id as string, targetColumn.id, colCards.length)
  }

  if (loading) return <div className="px-16 text-notion-muted text-sm">Loading board...</div>

  return (
    <div className="px-16 py-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <KanbanColumnComponent
              key={col.id}
              column={col}
              cards={cards.filter(c => c.column_id === col.id)}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
              onDeleteColumn={deleteColumn}
            />
          ))}
          <button
            onClick={addColumn}
            className="flex-shrink-0 w-64 flex items-center gap-2 px-3 py-2 text-sm text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded-lg transition-colors h-fit"
          >
            <Plus className="w-4 h-4" />
            Add column
          </button>
        </div>
      </DndContext>
    </div>
  )
}
