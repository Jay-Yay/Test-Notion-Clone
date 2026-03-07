import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')
    const code = params.get('code')

    if (errorParam) {
      setError(errorDescription ?? errorParam)
      return
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message)
        else navigate('/app', { replace: true })
      })
    } else {
      navigate('/app', { replace: true })
    }
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-notion-bg dark:bg-notion-bg-dark">
        <div className="text-center space-y-4 p-8 max-w-sm">
          <p className="text-red-500 font-medium">Sign in failed</p>
          <p className="text-notion-muted text-sm">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-sm text-notion-text dark:text-notion-text-dark underline"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-notion-muted">
      Signing in…
    </div>
  )
}
