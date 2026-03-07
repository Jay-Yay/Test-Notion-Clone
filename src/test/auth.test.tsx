import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, profile: null, loading: false }),
}))

describe('LoginPage', () => {
  it('renders Google and GitHub sign-in buttons', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in with github/i)).toBeInTheDocument()
  })
})
