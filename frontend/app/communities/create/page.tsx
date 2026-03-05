'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CATS = ['Technical','Cultural','Sports','Social','Professional','Other']
const DEPTS = ['CSE','ECE','EEE','ME','CE','IT','MCA','MBA','All Departments']

export default function CreateCommunity() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name:'', description:'', category:'', department:'', type:'general' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)
    })
  }, [router])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.category) { setError('Category is required'); return }
    setLoading(true)
    const { data, error: err } = await supabase.from('communities').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      department: form.department || null,
      type: form.type,
      created_by: userId,
      is_active: true,
      is_approved: true,
      approval_status: 'approved',
    }).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    await supabase.from('community_members').insert({ community_id: data.id, profile_id: userId, role:'admin' })
    router.push(`/communities/${data.id}/manage`)
  }

  return (
    <div className="page-sm">
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom:'20px' }}>← Back</button>
      <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Create Community</h1>
      <p style={{ color:'var(--text2)', fontSize:'13px', margin:'0 0 24px' }}>Build a space for students with shared interests</p>
      {error && <div className="error-box" style={{ marginBottom:'16px' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
        <div className="card" style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <div><label className="label">Community Name *</label>
            <input className="input" placeholder="e.g. IEDC AISAT, NSS Unit 42" value={form.name} onChange={set('name')} />
          </div>
          <div><label className="label">Description</label>
            <textarea className="input" placeholder="What does this community do?" value={form.description}
              onChange={set('description') as any} rows={3} style={{ resize:'none' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div><label className="label">Type</label>
              <select className="input" value={form.type} onChange={set('type')}>
                <option value="general">General (IEDC, IEEE…)</option>
                <option value="class">Class (Dept + Semester)</option>
              </select>
            </div>
            <div><label className="label">Category *</label>
              <select className="input" value={form.category} onChange={set('category')}>
                <option value="">Select</option>{CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Department</label>
            <select className="input" value={form.department} onChange={set('department')}>
              <option value="">All Departments</option>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading||!userId} className="btn btn-primary" style={{ width:'100%', padding:'12px' }}>
          {loading ? <><span className="spinner"/>Creating…</> : 'Create Community →'}
        </button>
      </form>
    </div>
  )
}