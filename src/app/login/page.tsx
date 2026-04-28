'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const s = {
  screen: {
    position: 'absolute' as const, inset: 0, display: 'flex', flexDirection: 'column' as const,
    background: 'var(--ink)', overflowY: 'auto' as const,
  },
  scroll: { flex: 1, overflowY: 'auto' as const, padding: '64px 24px 140px' },
  back: {
    background: 'none', border: 'none', color: 'var(--t3)', fontFamily: 'var(--sans)',
    fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'flex',
    alignItems: 'center', gap: 6, letterSpacing: '.04em', textTransform: 'uppercase' as const,
  },
  title: {
    fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, marginBottom: 8,
    lineHeight: 1.15, color: 'var(--t1)',
  },
  sub: { fontSize: 14, color: 'var(--t3)', marginBottom: 32, lineHeight: 1.7, fontWeight: 400 },
  lbl: {
    fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em',
    textTransform: 'uppercase' as const, marginBottom: 8, display: 'block',
  },
  inp: {
    width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)',
    borderRadius: 14, color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 15,
    padding: '16px 18px', outline: 'none', marginBottom: 18, transition: 'all .2s',
  },
  err: { color: 'var(--pink)', fontSize: 12, marginBottom: 14, minHeight: 16, display: 'block', letterSpacing: '.02em' },
  ctaWrap: {
    position: 'fixed' as const, bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 430, padding: '16px 24px 44px',
    background: 'linear-gradient(to top,var(--ink) 65%,transparent)',
  },
  cta: {
    width: '100%', padding: 18,
    background: 'linear-gradient(145deg,var(--g3),var(--g1),var(--g2))',
    border: 'none', borderRadius: 16, color: '#fff', fontFamily: 'var(--sans)',
    fontSize: 15, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const,
    cursor: 'pointer', boxShadow: '0 8px 32px rgba(168,85,247,.30)',
  },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const router = useRouter()

  async function handleLogin() {
    if (!email || !password) { setError('נא למלא את כל השדות'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        const code = (authError as { code?: string }).code ?? ''
        const msg = authError.message ?? ''
        const msgLower = msg.toLowerCase()
        if (code === 'invalid_credentials' || msgLower.includes('invalid login') || msgLower.includes('invalid credentials') || msgLower.includes('email not found') || msgLower.includes('wrong password')) {
          setError('אימייל או סיסמא שגויים')
        } else if (code === 'email_not_confirmed' || msgLower.includes('email not confirmed') || msgLower.includes('confirm')) {
          setError('יש לאמת את האימייל שלך — בדוק את תיבת הדואר')
        } else if (msgLower.includes('rate limit') || msgLower.includes('too many')) {
          setError('יותר מדי ניסיונות — נסה שוב בעוד כמה דקות')
        } else {
          setError(`שגיאת כניסה: ${msg} (קוד: ${code || 'unknown'})`)
        }
        console.error('Supabase auth error:', { code, message: msg, status: authError.status })
        setLoading(false)
        return
      }
      if (!data.user) {
        setError('שגיאה לא ידועה — נסה שוב')
        setLoading(false)
        return
      }
      router.push('/swipe')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('Login exception:', msg)
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        setError(`שגיאת רשת — האם שרת Supabase פעיל? (${msg})`)
      } else {
        setError(`שגיאה: ${msg}`)
      }
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!resetEmail) { setResetError('נא להזין אימייל'); return }
    setResetLoading(true)
    setResetError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login',
      })
      if (error) {
        setResetError(`שגיאה: ${error.message}`)
      } else {
        setResetSent(true)
      }
    } catch (e: unknown) {
      setResetError(`שגיאת חיבור: ${e instanceof Error ? e.message : 'נסה שוב'}`)
    }
    setResetLoading(false)
  }

  // ── Forgot password view ────────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div style={s.screen}>
        <div style={s.scroll}>
          <button style={s.back} onClick={() => { setShowForgot(false); setResetSent(false); setResetError('') }}>
            ← חזור לכניסה
          </button>
          <div style={s.title}>
            איפוס <em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>סיסמא</em>
          </div>
          <div style={s.sub}>נשלח לך מייל עם קישור לאיפוס הסיסמא</div>

          {resetSent ? (
            <div style={{
              background: 'rgba(72,216,154,.08)', border: '1px solid rgba(72,216,154,.3)',
              borderRadius: 16, padding: '22px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, color: 'var(--mint)', marginBottom: 8 }}>
                שלחנו לך מייל לאיפוס סיסמא ✓
              </div>
              <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>
                בדוק את תיבת הדואר שלך ולחץ על הקישור באימייל
              </div>
            </div>
          ) : (
            <>
              <label style={s.lbl}>אימייל</label>
              <input
                style={s.inp} type="email" placeholder="you@example.com"
                value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                onFocus={e => { e.target.style.borderColor = 'var(--gborder)'; e.target.style.background = 'rgba(255,255,255,.06)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.background = 'rgba(255,255,255,.04)' }}
              />
              <span style={s.err}>{resetError}</span>
            </>
          )}
        </div>

        {!resetSent && (
          <div style={s.ctaWrap}>
            <button
              style={{ ...s.cta, opacity: resetLoading ? .6 : 1 }}
              onClick={handleResetPassword}
              disabled={resetLoading}
            >
              {resetLoading ? 'שולח...' : 'שלח מייל איפוס ✦'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Login view ──────────────────────────────────────────────────────────────
  return (
    <div style={s.screen}>
      <div style={s.scroll}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={s.back}>← חזור</button>
        </Link>
        <div style={s.title}>
          ברוך הבא <em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>חזרה</em>
        </div>
        <div style={s.sub}>כנס עם האימייל והסיסמא שלך</div>

        <label style={s.lbl}>אימייל</label>
        <input
          style={s.inp} type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onFocus={e => { e.target.style.borderColor = 'var(--gborder)'; e.target.style.background = 'rgba(255,255,255,.06)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.background = 'rgba(255,255,255,.04)' }}
        />

        <label style={s.lbl}>סיסמא</label>
        <input
          style={s.inp} type="password" placeholder="••••••"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          onFocus={e => { e.target.style.borderColor = 'var(--gborder)'; e.target.style.background = 'rgba(255,255,255,.06)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.background = 'rgba(255,255,255,.04)' }}
        />

        <button
          onClick={() => { setShowForgot(true); setResetEmail(email) }}
          style={{
            background: 'none', border: 'none', color: 'var(--g3)', fontFamily: 'var(--sans)',
            fontSize: 12, cursor: 'pointer', padding: '0 0 18px', letterSpacing: '.03em',
            display: 'block', textAlign: 'right', width: '100%',
          }}
        >
          שכחתי סיסמא ›
        </button>

        <span style={s.err}>{error}</span>
      </div>

      <div style={s.ctaWrap}>
        <button style={{ ...s.cta, opacity: loading ? .6 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'מתחבר...' : 'כניסה ✦'}
        </button>
      </div>
    </div>
  )
}
