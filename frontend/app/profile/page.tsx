'use client'

import { useEffect, useState } from 'react'
import { supabase, SKILLS_LIST } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function Page() {
  const [profile, setProfile] = useState<any>(null)
  const [facultyList, setFacultyList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Editable fields
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [facultyCoordinatorId, setFacultyCoordinatorId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, departments(name, code), batches!profiles_batch_id_fkey(name, scheme), faculty_coordinator:faculty_coordinator_id(id, full_name)')
        .eq('id', user.id)
        .single()

      setProfile(prof)
      setGithub(prof?.github_url || '')
      setLinkedin(prof?.linkedin_url || '')
      setPhone(prof?.phone || '')
      setSelectedSkills(prof?.skills || [])
      setFacultyCoordinatorId(prof?.faculty_coordinator_id || '')

      // Only load faculty list for students
      if (prof?.role === 'student') {
        const { data: fac } = await supabase
          .from('profiles')
          .select('id, full_name, departments(name)')
          .eq('role', 'faculty')
          .order('full_name')
        setFacultyList(fac || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const toggleSkill = (s: string) => {
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updates: any = {
        github_url: github || null,
        linkedin_url: linkedin || null,
        phone: phone || null,
      }

      // Only students can update skills and coordinator
      if (profile?.role === 'student') {
        updates.skills = selectedSkills
        updates.faculty_coordinator_id = facultyCoordinatorId || null
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  const isStudent = profile?.role === 'student'
  const isFaculty = profile?.role === 'faculty'
  const isAdmin = profile?.role === 'system_admin'

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">
            {isAdmin ? 'System Administrator' : isFaculty ? 'Faculty Coordinator' : 'Student Profile'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', maxWidth: '860px' }}>
          <div>
            {/* Read-only academic info */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                Account Info <span style={{ color: 'var(--text-3)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(set by admin)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { label: 'Full Name', val: profile?.full_name },
                  { label: 'Email', val: profile?.email },
                  { label: 'Role', val: profile?.role?.replace('_', ' ') },
                  { label: 'Department', val: profile?.departments?.name },
                  ...(isStudent ? [
                    { label: 'Roll Number', val: profile?.roll_number },
                    { label: 'Semester', val: profile?.semester ? `S${profile.semester}` : null },
                    { label: 'Batch', val: profile?.batches?.name },
                    { label: 'KTU Scheme', val: profile?.batches?.scheme ? `${profile.batches.scheme} Scheme` : null },
                  ] : []),
                ].filter(x => x.val).map(({ label, val }) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', textTransform: 'capitalize' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Links — all roles */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                Contact & Links
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input className="input" placeholder="+91 XXXXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
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

            {/* Faculty coordinator picker — students only */}
            {isStudent && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Faculty Coordinator
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>
                  Your coordinator reviews and approves your certificates.
                </p>
                {facultyList.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                    No faculty accounts found. Ask your admin to add faculty users.
                  </div>
                ) : (
                  <select className="input" value={facultyCoordinatorId} onChange={e => setFacultyCoordinatorId(e.target.value)}>
                    <option value="">Select faculty coordinator</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.full_name}{f.departments?.name ? ` — ${f.departments.name}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Skills — students only */}
            {isStudent && (
              <>
                {Object.entries(SKILLS_LIST).map(([cat, items]) => (
                  <div key={cat} className="card" style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                      {cat}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {items.map((s: string) => {
                        const active = selectedSkills.includes(s)
                        return (
                          <button key={s} onClick={() => toggleSkill(s)} style={{
                            padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '500',
                            cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                            border: `1px solid ${active ? '#4f8ef740' : 'var(--border)'}`,
                            background: active ? 'var(--accent-glow)' : 'var(--bg-3)',
                            color: active ? 'var(--accent)' : 'var(--text-2)',
                            transition: 'all 0.12s',
                          }}>{s}</button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {error && (
              <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Saving...</>
                : saved ? '✓ Saved!' : 'Save Changes'
              }
            </button>
          </div>

          {/* Right sidebar summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: isAdmin ? '#a78bfa20' : isFaculty ? 'var(--green-glow)' : 'var(--accent-glow)',
                  color: isAdmin ? 'var(--purple)' : isFaculty ? 'var(--green)' : 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: '700', margin: '0 auto 12px',
                }}>
                  {profile?.full_name?.charAt(0)}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700' }}>{profile?.full_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{profile?.email}</div>
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge ${isAdmin ? 'badge-purple' : isFaculty ? 'badge-green' : 'badge-blue'}`}>
                    {isAdmin ? 'System Admin' : isFaculty ? 'Faculty' : 'Student'}
                  </span>
                </div>
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                {isStudent && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-3)' }}>Skills</span>
                      <span style={{ fontWeight: '600' }}>{selectedSkills.length} selected</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-3)' }}>Coordinator</span>
                      <span style={{ fontWeight: '600', color: facultyCoordinatorId ? 'var(--green)' : 'var(--red)' }}>
                        {facultyCoordinatorId ? '✓ Set' : '⚠ Not set'}
                      </span>
                    </div>
                  </>
                )}
                {github && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>GitHub</span>
                    <a href={github} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '11px' }}>View →</a>
                  </div>
                )}
                {linkedin && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>LinkedIn</span>
                    <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '11px' }}>View →</a>
                  </div>
                )}
              </div>

              {isStudent && selectedSkills.length > 0 && (
                <>
                  <div className="divider" />
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Your Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedSkills.slice(0, 10).map(s => (
                      <span key={s} className="badge badge-blue" style={{ fontSize: '10px' }}>{s}</span>
                    ))}
                    {selectedSkills.length > 10 && (
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{selectedSkills.length - 10} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}