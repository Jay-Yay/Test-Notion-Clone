import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TableView from '../components/TableView'

vi.mock('../hooks/useTable', () => ({
  useTable: () => ({
    columns: [{ id: 'col1', page_id: 'p1', name: 'Name', type: 'text', position: 0 }],
    rows: [{ id: 'row1', page_id: 'p1', position: 0 }],
    cells: [{ id: 'cell1', row_id: 'row1', column_id: 'col1', value: 'Alice' }],
    loading: false,
    addRow: vi.fn(), addColumn: vi.fn(), updateCell: vi.fn(), updateColumn: vi.fn(),
  }),
}))

describe('TableView', () => {
  it('renders column headers and cell values', () => {
    render(<TableView pageId="p1" />)
    expect(screen.getByDisplayValue('Name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })
})
