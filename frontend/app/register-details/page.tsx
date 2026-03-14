'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, SKILLS_LIST } from '@/lib/supabase'

export default function RegisterDetails() {
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*, departments(name), batches!profiles_batch_id_fkey(name)')
        .eq('id', user.id)
        .single()

      if (!data) {
        setProfile({ _no_profile: true })
      } else {
        setProfile(data)
        setGithub(data.github_url || '')
        setLinkedin(data.linkedin_url || '')
        // skills and interests are stored in the same skills[] column
        setSelectedSkills(data.skills || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleSkill = (val: string) => {
    setSelectedSkills(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          github_url: github,
          linkedin_url: linkedin,
          skills: selectedSkills,
          is_profile_complete: true,
        })
        .eq('id', user.id)

      if (error) throw error

      const role = profile?.role
      if (role === 'system_admin') router.push('/admin')
      else if (role === 'faculty') router.push('/faculty')
      else router.push('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Failed to save profile')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (profile?._no_profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ marginBottom: '8px' }}>Account Not Set Up Yet</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>
            Your account hasn't been created by the admin yet. Please contact your system administrator.
          </p>
          <button className="btn btn-ghost" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, #4f8ef7, #3ecf8e)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>🌉</div>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>CampusBridge</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Complete your profile</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            Your basic info has been set up by admin. Add your skills and links below.
          </p>
        </div>

        {/* Pre-filled info */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your Info
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Name', val: profile?.full_name },
              { label: 'Email', val: profile?.email },
              { label: 'Department', val: profile?.departments?.name },
              { label: 'Semester', val: profile?.semester ? `Semester ${profile.semester}` : null },
              { label: 'Roll Number', val: profile?.roll_number },
              { label: 'Batch', val: profile?.batches?.name },
            ].filter(x => x.val).map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub & LinkedIn */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Links <span style={{ fontWeight: '400', textTransform: 'none' }}>(optional)</span>
          </div>
          <div className="input-group">
            <label className="input-label">GitHub URL</label>
            <input className="input" placeholder="https://github.com/username" value={github} onChange={e => setGithub(e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">LinkedIn Username</label>
            <input className="input" placeholder="e.g. antony-rubens" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
          </div>
        </div>

        {/* Skills by category */}
        {Object.entries(SKILLS_LIST).map(([category, items]) => (
          <div key={category} className="card" style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {category}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>
              Select all that apply — community admins use this to scout you for events.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {items.map((skill: string) => {
                const active = selectedSkills.includes(skill)
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '99px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily: 'Sora, sans-serif',
                      border: `1px solid ${active ? '#4f8ef740' : 'var(--border)'}`,
                      background: active ? 'var(--accent-glow)' : 'var(--bg-3)',
                      color: active ? 'var(--accent)' : 'var(--text-2)',
                      transition: 'all 0.12s',
                    }}
                  >{skill}</button>
                )
              })}
            </div>
          </div>
        ))}

        {selectedSkills.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>
            ✓ {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginBottom: '40px' }}
        >
          {saving
            ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Saving...</>
            : 'Save & Continue →'
          }
        </button>
      </div>
    </div>
  )
}