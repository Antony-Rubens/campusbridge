'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const CATS = ['Technical','Cultural','Sports','Social','Professional','Other']
const DEPTS = ['CSE','ECE','EEE','ME','CE','IT','MCA','MBA','All Departments']

export default function ManageCommunity() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [members, setMembers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name:'', description:'', category:'', department:'' })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }

      const { data: comm } = await supabase.from('communities').select('*').eq('id', id).single()
      if (!comm || comm.created_by !== session.user.id) { router.push('/communities'); return }
      setForm({ name: comm.name ?? '', description: comm.description ?? '', category: comm.category ?? '', department: comm.department ?? '' })

      const { data: mems } = await supabase.from('community_members')
        .select('*, profile:profiles(full_name,department,role)').eq('community_id', id)
      setMembers(mems ?? [])
    }
    load()
  }, [id, router])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }))

  const save = async () => {
    setSaving(true)
    const { error: err } = await supabase.from('communities').update({
      name: form.name, description: form.description || null,
      category: form.category, department: form.department || null, updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (err) setError(err.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  const changeRole = async (profileId: string, role: string) => {
    await supabase.from('community_members').update({ role }).eq('community_id', id).eq('profile_id', profileId)
    setMembers(p => p.map(m => m.profile_id === profileId ? { ...m, role } : m))
  }

  const removeMember = async (profileId: string) => {
    await supabase.from('community_members').delete().eq('community_id', id).eq('profile_id', profileId)
    setMembers(p => p.filter(m => m.profile_id !== profileId))
  }

  return (
    <div className="page-sm">
      <Link href={`/communities/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom:'20px', display:'inline-flex' }}>← Back to Community</Link>
      <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 24px' }}>Manage Community</h1>

      {error && <div className="error-box" style={{ marginBottom:'16px' }}>{error}</div>}

      <div className="card fade-up" style={{ padding:'20px', marginBottom:'16px', display:'flex', flexDirection:'column', gap:'14px' }}>
        <h2 style={{ margin:0, fontSize:'13px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.05em' }}>Details</h2>
        <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div><label className="label">Description</label>
          <textarea className="input" value={form.description} onChange={set('description') as any} rows={3} style={{ resize:'none' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div><label className="label">Category</label>
            <select className="input" value={form.category} onChange={set('category')}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Department</label>
            <select className="input" value={form.department} onChange={set('department')}>
              <option value="">All</option>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
          {saving ? <><span className="spinner"/>Saving…</> : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="card fade-up-1" style={{ padding:'20px' }}>
        <h2 style={{ margin:'0 0 14px', fontSize:'13px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.05em' }}>Members ({members.length})</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {members.map(m => (
            <div key={m.profile_id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', background:'var(--surface2)', borderRadius:'10px' }}>
              <div className="avatar" style={{ width:32, height:32, fontSize:12 }}>{m.profile?.full_name?.[0]}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:600, color:'var(--text)', fontSize:'13px', margin:'0 0 1px' }}>{m.profile?.full_name}</p>
                <p style={{ color:'var(--text3)', fontSize:'11px', margin:0 }}>{m.profile?.department} · {m.profile?.role}</p>
              </div>
              <select value={m.role} onChange={e => changeRole(m.profile_id, e.target.value)}
                className="input" style={{ width:'auto', padding:'5px 10px', fontSize:'12px' }}>
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={() => removeMember(m.profile_id)} className="btn btn-danger btn-xs">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}