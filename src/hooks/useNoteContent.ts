import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNoteContent(pageId: string) {
  const [content, setContent] = useState<object | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('note_content')
      .select('content')
      .eq('page_id', pageId)
      .single()
      .then(({ data }) => {
        setContent(data?.content ?? null)
        setLoading(false)
      })
  }, [pageId])

  const saveContent = useCallback(async (json: object) => {
    await supabase
      .from('note_content')
      .upsert({ page_id: pageId, content: json }, { onConflict: 'page_id' })
  }, [pageId])

  return { content, saveContent, loading }
}
