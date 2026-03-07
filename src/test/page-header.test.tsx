import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PageHeader from '../components/PageHeader'
import { Page } from '../types'

const mockPage: Page = {
  id: '1', title: 'My Page', icon: null, cover_image: null,
  type: 'note', parent_id: null, owner_id: 'u1',
  created_at: '', updated_at: '',
}

describe('PageHeader', () => {
  it('renders the page title', () => {
    render(<PageHeader page={mockPage} onUpdate={vi.fn()} />)
    expect(screen.getByDisplayValue('My Page')).toBeInTheDocument()
  })

  it('calls onUpdate when title changes', () => {
    const onUpdate = vi.fn()
    render(<PageHeader page={mockPage} onUpdate={onUpdate} />)
    const input = screen.getByDisplayValue('My Page')
    fireEvent.change(input, { target: { value: 'New Title' } })
    expect(onUpdate).toHaveBeenCalledWith({ title: 'New Title' })
  })
})
