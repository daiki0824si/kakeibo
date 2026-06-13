'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginButton() {
  const supabase = createClient()

  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); handleLogin() }}
        style={{
          display: 'inline-block',
          background: 'linear-gradient(to right, #fb923c, #ec4899)',
          color: 'white',
          fontWeight: 'bold',
          padding: '16px 32px',
          borderRadius: '16px',
          fontSize: '18px',
          textDecoration: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Googleでログイン
      </a>
      {error && <p style={{ color: 'red', marginTop: '12px', fontSize: '14px' }}>{error}</p>}
    </>
  )
}
