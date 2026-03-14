'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Role = 'student' | 'faculty' | 'system_admin' | null

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    { key: 'student' as Role, icon: '🎓', title: 'Student', desc: 'Track activity points, join communities, discover events', accent: '#2c3e50' }, // Dusk Blue
    { key: 'faculty' as Role, icon: '🧑‍🏫', title: 'Faculty Coordinator', desc: 'Review certificates, manage your assigned students', accent: '#a21a1a' }, // Ruby Red
    { key: 'system_admin' as Role, icon: '⚙️', title: 'System Admin', desc: 'Manage departments, batches, users and platform settings', accent: '#5d81a5' },
  ]

  const handleLogin = async () => {
    if (!selectedRole) return
    setLoading(true)
    setError('')
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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px',
        background: 'radial-gradient(ellipse, #4f8ef712 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            {/* --- Updated Logo Section --- */}
            <div style={{
              width: '42px', height: '42px',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', padding: '4px'
            }}>
              <img 
                src="/logo.ico" 
                alt="CampusBridge Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
            {/* ---------------------------- */}
            <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.03em', color: 'var(--text)' }}>CampusBridge</span>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Select your role to continue</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {roles.map((role) => (
            <button key={role.key} onClick={() => setSelectedRole(role.key)} style={{
              background: selectedRole === role.key ? `${role.accent}10` : 'var(--bg-2)',
              border: `1px solid ${selectedRole === role.key ? role.accent + '40' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '16px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left',
              transition: 'all 0.15s', width: '100%',
            }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{role.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: selectedRole === role.key ? role.accent : 'var(--text)', marginBottom: '2px', fontFamily: 'Sora, sans-serif' }}>
                  {role.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'Sora, sans-serif', lineHeight: '1.4' }}>
                  {role.desc}
                </div>
              </div>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: `2px solid ${selectedRole === role.key ? role.accent : 'var(--border-active)'}`,
                background: selectedRole === role.key ? role.accent : 'transparent',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}>
                {selectedRole === role.key && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={!selectedRole || loading} className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', background: 'var(--accent)' }}>
          {loading
            ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Redirecting...</>
            : <>Continue with Google →</>
          }
        </button>
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-3)', marginTop: '20px' }}>
          AISAT · KTU Activity Point Management
        </p>
      </div>
    </div>
  )
}