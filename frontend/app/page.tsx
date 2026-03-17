'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Role = 'student' | 'faculty' | 'system_admin' | null

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Apply system theme on landing page too
    try {
      const saved = localStorage.getItem('cb-theme')
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved)
      } else {
        const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', prefer)
      }
    } catch(e) {}
  }, [])

  const roles = [
    { key: 'student' as Role,       icon: '🎓', title: 'Student',           desc: 'Track activity points, join communities, discover events',    color: 'var(--accent)' },
    { key: 'faculty' as Role,       icon: '🧑‍🏫', title: 'Faculty Coordinator', desc: 'Review certificates, manage your assigned students',           color: 'var(--green)' },
    { key: 'system_admin' as Role,  icon: '⚙️', title: 'System Admin',       desc: 'Manage departments, batches, users and platform settings',     color: 'var(--purple)' },
  ]

  const handleLogin = async () => {
    if (!selectedRole) return
    setLoading(true); setError('')
    try {
      localStorage.setItem('intended_role', selectedRole)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (e: any) {
      setError(e.message || 'Login failed. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{
            width: '40px', height: '40px', background: '#0a2d6e',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: '16px', height: '16px', border: '2.5px solid #c8a84b', borderRadius: '2px', transform: 'rotate(45deg)' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.02em' }}>CampusBridge</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.04em' }}>AISAT · KTU Activity Points</div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>
          Select your role to continue
        </p>

        {/* Role cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {roles.map((role) => {
            const active = selectedRole === role.key
            return (
              <button key={role.key} onClick={() => setSelectedRole(role.key)} style={{
                background: active ? 'var(--bg-3)' : 'var(--bg-2)',
                border: `1px solid ${active ? role.color : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '14px 16px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
                textAlign: 'left', transition: 'all 0.15s', width: '100%',
                boxShadow: active ? `0 0 0 3px ${role.color}14` : 'none',
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{role.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: active ? role.color : 'var(--text)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '1px' }}>
                    {role.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: '1.4' }}>
                    {role.desc}
                  </div>
                </div>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${active ? role.color : 'var(--border-active)'}`,
                  background: active ? role.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {active && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />}
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <div style={{ background: 'var(--red-glow)', border: '1px solid var(--red-glow)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={!selectedRole || loading} className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}>
          {loading
            ? <><div className="spinner" style={{ width: '15px', height: '15px' }} /> Redirecting...</>
            : 'Continue with Google →'
          }
        </button>
      </div>
    </div>
  )
}