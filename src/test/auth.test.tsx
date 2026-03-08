import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
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

  it('renders email and password inputs', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('calls signInWithPassword on sign in submit', async () => {
    const { supabase } = await import('../lib/supabase')
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' }))
  })

  it('switches to sign up mode and calls signUp', async () => {
    const { supabase } = await import('../lib/supabase')
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'newpass123' }))
  })
})
