import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Page, PageType } from '../types'
import { useAuth } from '../context/AuthContext'

export function usePages() {
  const { user } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPages = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('pages').select('*').order('created_at')
    setPages(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPages()

    const channel = supabase
      .channel('pages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pages' }, fetchPages)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPages])

  const createPage = async (type: PageType, parentId?: string) => {
    if (!user) return
    const { data } = await supabase
      .from('pages')
      .insert({ type, owner_id: user.id, parent_id: parentId ?? null })
      .select()
      .single()
    return data as Page
  }

  const updatePage = async (id: string, updates: Partial<Page>) => {
    await supabase.from('pages').update(updates).eq('id', id)
  }

  const deletePage = async (id: string) => {
    await supabase.from('pages').delete().eq('id', id)
  }

  return { pages, loading, createPage, updatePage, deletePage, refetch: fetchPages }
}
