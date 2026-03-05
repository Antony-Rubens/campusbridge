'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('is_profile_complete').eq('id', session.user.id).single()
          .then(({ data }) => router.push(data?.is_profile_complete ? '/dashboard' : '/register-details'))
      } else setChecking(false)
    })
  }, [router])

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Enter your email'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (checking) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-10%', left:'50%', transform:'translateX(-50%)', width:'700px', height:'700px', background:'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ width:'100%', maxWidth:'380px', position:'relative' }}>
        <div className="fade-up" style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'48px', height:'48px', background:'var(--amber-dim)', border:'1px solid var(--amber-border)', borderRadius:'12px', marginBottom:'14px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ fontSize:'24px', fontWeight:800, color:'var(--text)', margin:'0 0 4px', letterSpacing:'-0.5px' }}>CampusBridge</h1>
          <p style={{ fontSize:'13px', color:'var(--text2)', margin:0 }}>AISAT · KTU Activity Portal</p>
        </div>

        <div className="card fade-up-1" style={{ padding:'24px' }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ fontSize:'36px', marginBottom:'10px' }}>📬</div>
              <h2 style={{ fontSize:'15px', fontWeight:700, color:'var(--text)', marginBottom:'6px' }}>Check your inbox</h2>
              <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'16px' }}>Magic link sent to <strong style={{ color:'var(--text)' }}>{email}</strong></p>
              <button onClick={() => setSent(false)} className="btn btn-ghost btn-sm">← Try again</button>
            </div>
          ) : (
            <>
              {error && <div className="error-box" style={{ marginBottom:'14px' }}>{error}</div>}
              <button onClick={handleGoogle} className="btn btn-secondary" style={{ width:'100%', marginBottom:'14px', justifyContent:'center' }}>
                <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <hr className="divider" style={{ flex:1 }} />
                <span style={{ fontSize:'11px', color:'var(--text3)' }}>or</span>
                <hr className="divider" style={{ flex:1 }} />
              </div>
              <form onSubmit={handleEmail} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <input type="email" placeholder="your@college.edu" value={email} onChange={e => setEmail(e.target.value)} className="input" />
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%' }}>
                  {loading ? <><span className="spinner" />Sending…</> : 'Send Magic Link'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="fade-up-2" style={{ textAlign:'center', fontSize:'11px', color:'var(--text3)', marginTop:'16px' }}>Authorized users only · AISAT Kalamassery</p>
      </div>
    </div>
  )
}