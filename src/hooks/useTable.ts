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
    if (rws && rws.length > 0) {
      const rowIds = rws.map((r: TableRow) => r.id)
      const { data: cls } = await supabase.from('table_cells').select('*').in('row_id', rowIds)
      setCells(cls ?? [])
    }
  }, [pageId])

  useEffect(() => { fetch() }, [fetch])

  const addColumn = async () => {
    const tempId = crypto.randomUUID()
    const position = columns.length
    setColumns(prev => [...prev, { id: tempId, page_id: pageId, name: 'Column', type: 'text', position }])
    const { data } = await supabase.from('table_columns').insert({ page_id: pageId, name: 'Column', type: 'text', position }).select().single()
    if (data) setColumns(prev => prev.map(c => c.id === tempId ? data : c))
    else fetch()
  }

  const addRow = async () => {
    const tempId = crypto.randomUUID()
    const position = rows.length
    setRows(prev => [...prev, { id: tempId, page_id: pageId, position }])
    const { data } = await supabase.from('table_rows').insert({ page_id: pageId, position }).select().single()
    if (data) setRows(prev => prev.map(r => r.id === tempId ? data : r))
    else fetch()
  }

  const updateColumn = async (columnId: string, name: string) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, name } : c))
    await supabase.from('table_columns').update({ name }).eq('id', columnId)
  }

  const updateCell = async (rowId: string, columnId: string, value: string) => {
    setCells(prev => {
      const existing = prev.find(c => c.row_id === rowId && c.column_id === columnId)
      if (existing) return prev.map(c => c.row_id === rowId && c.column_id === columnId ? { ...c, value } : c)
      return [...prev, { id: crypto.randomUUID(), row_id: rowId, column_id: columnId, value }]
    })
    await supabase.from('table_cells').upsert({ row_id: rowId, column_id: columnId, value }, { onConflict: 'row_id,column_id' })
  }

  return { columns, rows, cells, loading, addColumn, addRow, updateColumn, updateCell }
}
