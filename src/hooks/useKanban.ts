import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { KanbanCard, KanbanColumn } from '../types'

export function useKanban(pageId: string) {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const [{ data: cols }, { data: allCards }] = await Promise.all([
      supabase.from('kanban_columns').select('*').eq('page_id', pageId).order('position'),
      supabase
        .from('kanban_cards')
        .select('*, kanban_columns!inner(page_id)')
        .eq('kanban_columns.page_id', pageId)
        .order('position'),
    ])
    setColumns(cols ?? [])
    setCards(allCards ?? [])
    setLoading(false)
  }, [pageId])

  useEffect(() => {
    fetch()
    const channel = supabase.channel(`kanban-${pageId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_cards' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_columns' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch, pageId])

  const addColumn = async () => {
    const tempId = crypto.randomUUID()
    const position = columns.length
    setColumns(prev => [...prev, { id: tempId, page_id: pageId, title: 'New Column', position }])
    const { data } = await supabase.from('kanban_columns').insert({ page_id: pageId, title: 'New Column', position }).select().single()
    if (data) setColumns(prev => prev.map(c => c.id === tempId ? data : c))
    else fetch()
  }

  const updateColumn = async (columnId: string, title: string) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, title } : c))
    await supabase.from('kanban_columns').update({ title }).eq('id', columnId)
  }

  const addCard = async (columnId: string) => {
    const colCards = cards.filter(c => c.column_id === columnId)
    const tempId = crypto.randomUUID()
    const position = colCards.length
    setCards(prev => [...prev, { id: tempId, column_id: columnId, title: 'Untitled Card', position }])
    const { data } = await supabase.from('kanban_cards').insert({ column_id: columnId, title: 'Untitled Card', position }).select().single()
    if (data) setCards(prev => prev.map(c => c.id === tempId ? data : c))
    else fetch()
  }

  const moveCard = async (cardId: string, newColumnId: string, newPosition: number) => {
    await supabase.from('kanban_cards').update({ column_id: newColumnId, position: newPosition }).eq('id', cardId)
  }

  const deleteCard = async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
    await supabase.from('kanban_cards').delete().eq('id', cardId)
  }

  const deleteColumn = async (columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId))
    await supabase.from('kanban_columns').delete().eq('id', columnId)
  }

  return { columns, cards, loading, addColumn, updateColumn, addCard, moveCard, deleteCard, deleteColumn }
}
