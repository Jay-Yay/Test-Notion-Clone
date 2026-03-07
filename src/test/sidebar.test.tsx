import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '../components/Sidebar'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1' }, profile: { full_name: 'Test User', avatar_url: null } }),
}))

vi.mock('../hooks/usePages', () => ({
  usePages: () => ({ pages: [], loading: false, createPage: vi.fn() }),
}))

describe('Sidebar', () => {
  it('renders the new page button', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    expect(screen.getByText(/new page/i)).toBeInTheDocument()
  })

  it('renders user name', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })
})
