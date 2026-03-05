'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const SKILLS = ['React','Node.js','Python','Java','C++','Machine Learning','UI/UX','Data Science','Flutter','Android','iOS','DevOps','Blockchain','Cybersecurity']
const INTERESTS = ['Hackathons','Open Source','Research','Entrepreneurship','Sports','Arts','Music','Gaming','Robotics','Photography','Writing','Social Work']

export default function ProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [facultyList, setFacultyList] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) {
        setForm(p)
        setSkills(p.skills ?? [])
        setInterests(p.interests ?? [])
        if (p.department && p.semester) loadFaculty(p.department, p.semester)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const loadFaculty = async (dept: string, sem: number) => {
    const { data: comm } = await supabase.from('communities').select('faculty_coordinator')
      .eq('type', 'class').eq('department', dept).eq('semester', sem).single()
    if (comm?.faculty_coordinator) {
      const { data } = await supabase.from('profiles').select('id,full_name,department').eq('id', comm.faculty_coordinator)
      setFacultyList(data ?? [])
    } else {
      const { data } = await supabase.from('profiles').select('id,full_name,department').eq('role', 'faculty').order('full_name')
      setFacultyList(data ?? [])
    }
  }

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val])

  const save = async () => {
    setSaving(true); setError('')
    const { error: err } = await supabase.from('profiles').update({
      github_link: form.github_link || null,
      linkedin_id: form.linkedin_id || null,
      faculty_coordinator_id: form.faculty_coordinator_id || null,
      skills, interests,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
    if (err) setError(err.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page-sm">
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>My Profile</h1>
      <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 24px' }}>Update your coordinator, skills and links</p>
      {error && <div className="error-box" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Faculty coordinator */}
      <div className="card fade-up" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Faculty Coordinator</h3>
        <p style={{ color: 'var(--text3)', fontSize: '12px', margin: '0 0 14px' }}>
          This faculty member reviews your activity point certificates. Change anytime.
        </p>
        {facultyList.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: '13px' }}>No faculty assigned to your class community yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {facultyList.map(f => (
              <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: form.faculty_coordinator_id === f.id ? 'var(--amber-dim)' : 'var(--surface2)', border: `1px solid ${form.faculty_coordinator_id === f.id ? 'var(--amber-border)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all .15s' }}>
                <input type="radio" name="fac" value={f.id} checked={form.faculty_coordinator_id === f.id}
                  onChange={e => setForm((p: any) => ({ ...p, faculty_coordinator_id: e.target.value }))}
                  style={{ accentColor: 'var(--amber)' }} />
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{f.full_name?.[0]}</div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', margin: '0 0 1px' }}>{f.full_name}</p>
                  <p style={{ color: 'var(--text3)', fontSize: '11px', margin: 0 }}>{f.department} · Faculty</p>
                </div>
                {form.faculty_coordinator_id === f.id && (
                  <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>Selected</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="card fade-up-1" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Skills</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SKILLS.map(s => (
            <button key={s} type="button" onClick={() => toggle(skills, setSkills, s)}
              className={`badge ${skills.includes(s) ? 'badge-amber' : 'badge-gray'}`}
              style={{ cursor: 'pointer', padding: '5px 12px', fontSize: '12px' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="card fade-up-2" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Interests</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {INTERESTS.map(i => (
            <button key={i} type="button" onClick={() => toggle(interests, setInterests, i)}
              className={`badge ${interests.includes(i) ? 'badge-blue' : 'badge-gray'}`}
              style={{ cursor: 'pointer', padding: '5px 12px', fontSize: '12px' }}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="card fade-up-3" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Links</h3>
        <div>
          <label className="label">GitHub URL</label>
          <input className="input" placeholder="https://github.com/username" value={form.github_link ?? ''}
            onChange={e => setForm((p: any) => ({ ...p, github_link: e.target.value }))} />
        </div>
        <div>
          <label className="label">LinkedIn Username</label>
          <input className="input" placeholder="your-linkedin-id" value={form.linkedin_id ?? ''}
            onChange={e => setForm((p: any) => ({ ...p, linkedin_id: e.target.value }))} />
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
        {saving ? <><span className="spinner" />Saving…</> : saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}