import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from '../pages/LoginPage'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}))

describe('LoginPage', () => {
  it('renders Google and GitHub sign-in buttons', () => {
    render(<LoginPage />)
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in with github/i)).toBeInTheDocument()
  })
})
