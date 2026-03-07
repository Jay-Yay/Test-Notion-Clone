import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NoteEditor from '../components/NoteEditor'

vi.mock('../hooks/useNoteContent', () => ({
  useNoteContent: () => ({ content: null, saveContent: vi.fn(), loading: false }),
}))

describe('NoteEditor', () => {
  it('renders the editor', () => {
    render(<NoteEditor pageId="1" />)
    expect(document.querySelector('.ProseMirror')).toBeInTheDocument()
  })
})
