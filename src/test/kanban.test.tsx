import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import KanbanBoard from '../components/KanbanBoard'

vi.mock('../hooks/useKanban', () => ({
  useKanban: () => ({
    columns: [{ id: 'c1', page_id: 'p1', title: 'To Do', position: 0 }],
    cards: [{ id: 'k1', column_id: 'c1', title: 'Card 1', description: null, position: 0, assigned_to: null }],
    loading: false,
    addColumn: vi.fn(), addCard: vi.fn(), moveCard: vi.fn(), deleteCard: vi.fn(), deleteColumn: vi.fn(),
  }),
}))

describe('KanbanBoard', () => {
  it('renders columns and cards', () => {
    render(<KanbanBoard pageId="p1" />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('Card 1')).toBeInTheDocument()
  })
})
