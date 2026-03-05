'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DEPTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'MCA', 'MBA']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const SKILLS = ['React', 'Node.js', 'Python', 'Java', 'C++', 'Machine Learning', 'UI/UX', 'Data Science', 'Flutter', 'Android', 'iOS', 'DevOps', 'Blockchain', 'Cybersecurity']
const INTERESTS = ['Hackathons', 'Open Source', 'Research', 'Entrepreneurship', 'Sports', 'Arts', 'Music', 'Gaming', 'Robotics', 'Photography', 'Writing', 'Social Work']

export default function RegisterDetails() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [facultyList, setFacultyList] = useState<any[]>([])
  const [form, setForm] = useState({
    full_name: '', department: '', semester: '', batch: '',
    admission_no: '', github_link: '', linkedin_id: '', faculty_coordinator_id: '',
  })
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)
    })
  }, [router])

  // Load faculty coordinators when department+semester selected
  useEffect(() => {
    if (!form.department || !form.semester) return
    const loadFaculty = async () => {
      // Get class community for this dept+semester
      const { data: comm } = await supabase
        .from('communities')
        .select('id, faculty_coordinator')
        .eq('type', 'class')
        .eq('department', form.department)
        .eq('semester', parseInt(form.semester))
        .single()

      if (comm?.faculty_coordinator) {
        const { data: fac } = await supabase
          .from('profiles')
          .select('id, full_name, department')
          .eq('id', comm.faculty_coordinator)
        setFacultyList(fac ?? [])
      } else {
        // Fall back: show all faculty
        const { data: facs } = await supabase
          .from('profiles')
          .select('id, full_name, department')
          .eq('role', 'faculty')
          .order('full_name')
        setFacultyList(facs ?? [])
      }
    }
    loadFaculty()
  }, [form.department, form.semester])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }))

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.department || !form.semester) {
      setError('Name, department and semester are required'); return
    }
    setLoading(true)
    const { error: err } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: form.full_name.trim(),
      department: form.department,
      semester: parseInt(form.semester),
      batch: form.batch || null,
      admission_no: form.admission_no || null,
      github_link: form.github_link || null,
      linkedin_id: form.linkedin_id || null,
      faculty_coordinator_id: form.faculty_coordinator_id || null,
      skills, interests,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div className="fade-up" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Complete your profile</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', margin: 0 }}>Set up once — used across the platform</p>
        </div>

        {error && <div className="error-box fade-up" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Basic info */}
          <div className="card fade-up-1" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Basic Info</h3>
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="e.g. Rahul Menon" value={form.full_name} onChange={set('full_name')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label">Department *</label>
                <select className="input" value={form.department} onChange={set('department')}>
                  <option value="">Select</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester *</label>
                <select className="input" value={form.semester} onChange={set('semester')}>
                  <option value="">Select</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>S{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label">Batch</label>
                <input className="input" placeholder="2022-2026" value={form.batch} onChange={set('batch')} />
              </div>
              <div>
                <label className="label">Admission No.</label>
                <input className="input" placeholder="AISAT22CS001" value={form.admission_no} onChange={set('admission_no')} />
              </div>
            </div>
          </div>

          {/* Faculty coordinator */}
          <div className="card fade-up-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Faculty Coordinator</h3>
              <p style={{ color: 'var(--text3)', fontSize: '12px', margin: 0 }}>
                Your faculty coordinator reviews and approves your activity point certificates. You can change this anytime.
              </p>
            </div>
            {!form.department || !form.semester ? (
              <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                Select your department and semester above to see available coordinators
              </p>
            ) : facultyList.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>
                No faculty coordinator assigned to your class yet — admin will assign one soon
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {facultyList.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: form.faculty_coordinator_id === f.id ? 'var(--amber-dim)' : 'var(--surface2)', border: `1px solid ${form.faculty_coordinator_id === f.id ? 'var(--amber-border)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all .15s' }}>
                    <input type="radio" name="faculty" value={f.id} checked={form.faculty_coordinator_id === f.id}
                      onChange={set('faculty_coordinator_id')} style={{ accentColor: 'var(--amber)' }} />
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{f.full_name?.[0]}</div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', margin: '0 0 1px' }}>{f.full_name}</p>
                      <p style={{ color: 'var(--text3)', fontSize: '11px', margin: 0 }}>{f.department} · Faculty</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="card fade-up-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Skills</h3>
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
          <div className="card fade-up-3" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Interests</h3>
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
          <div className="card fade-up-3" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Links (optional)</h3>
            <div>
              <label className="label">GitHub URL</label>
              <input className="input" placeholder="https://github.com/username" value={form.github_link} onChange={set('github_link')} />
            </div>
            <div>
              <label className="label">LinkedIn Username</label>
              <input className="input" placeholder="rahul-menon-abc123" value={form.linkedin_id} onChange={set('linkedin_id')} />
            </div>
          </div>

          <button type="submit" disabled={loading || !userId} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            {loading ? <><span className="spinner" />Saving…</> : 'Save & Continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}