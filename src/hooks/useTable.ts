import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TableColumn, TableRow, TableCell } from '../types'

export function useTable(pageId: string) {
  const [columns, setColumns] = useState<TableColumn[]>([])
  const [rows, setRows] = useState<TableRow[]>([])
  const [cells, setCells] = useState<TableCell[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const [{ data: cols }, { data: rws }] = await Promise.all([
      supabase.from('table_columns').select('*').eq('page_id', pageId).order('position'),
      supabase.from('table_rows').select('*').eq('page_id', pageId).order('position'),
    ])
    setColumns(cols ?? [])
    setRows(rws ?? [])
    setLoading(false)
    // Fetch cells separately after we know the rows
    if (rws && rws.length > 0) {
      const rowIds = rws.map((r: TableRow) => r.id)
      const { data: cls } = await supabase.from('table_cells').select('*').in('row_id', rowIds)
      setCells(cls ?? [])
    }
  }, [pageId])

  useEffect(() => { fetch() }, [fetch])

  const addColumn = async () => {
    await supabase.from('table_columns').insert({ page_id: pageId, name: 'Column', type: 'text', position: columns.length })
    fetch()
  }

  const addRow = async () => {
    await supabase.from('table_rows').insert({ page_id: pageId, position: rows.length })
    fetch()
  }

  const updateCell = async (rowId: string, columnId: string, value: string) => {
    // Optimistic update first
    setCells(prev => {
      const existing = prev.find(c => c.row_id === rowId && c.column_id === columnId)
      if (existing) return prev.map(c => c.row_id === rowId && c.column_id === columnId ? { ...c, value } : c)
      return [...prev, { id: crypto.randomUUID(), row_id: rowId, column_id: columnId, value }]
    })
    // Then persist
    await supabase.from('table_cells').upsert({ row_id: rowId, column_id: columnId, value }, { onConflict: 'row_id,column_id' })
  }

  return { columns, rows, cells, loading, addColumn, addRow, updateCell }
}
