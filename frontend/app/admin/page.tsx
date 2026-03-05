'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Tab = 'users'|'communities'|'verifiers'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])
  const [verifiers, setVerifiers] = useState<any[]>([])
  const [facultyList, setFacultyList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState('')
  const [newVerifier, setNewVerifier] = useState({ faculty_id:'', department:'' })
  const DEPTS = ['CSE','ECE','EEE','ME','CE','IT','MCA','MBA']

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role !== 'system_admin') { router.push('/dashboard'); return }

      const [usersRes, commRes, verRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending:false }),
        supabase.from('communities').select('*, creator:profiles!communities_created_by_fk(full_name)').order('created_at', { ascending:false }),
        supabase.from('certificate_verifiers').select('*, faculty:profiles(full_name,department)'),
      ])
      setUsers(usersRes.data ?? [])
      setCommunities(commRes.data ?? [])
      setVerifiers(verRes.data ?? [])
      setFacultyList((usersRes.data ?? []).filter((u: any) => u.role === 'faculty'))
      setLoading(false)
    }
    load()
  }, [router])

  const changeRole = async (uid: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', uid)
    setUsers(p => p.map(u => u.id === uid ? { ...u, role } : u))
    if (role === 'faculty') setFacultyList(p => [...p, users.find(u => u.id === uid)].filter(Boolean) as any[])
  }

  const toggleCommunity = async (commId: string, isActive: boolean) => {
    await supabase.from('communities').update({ is_active: !isActive }).eq('id', commId)
    setCommunities(p => p.map(c => c.id === commId ? { ...c, is_active: !isActive } : c))
  }

  const addVerifier = async () => {
    if (!newVerifier.faculty_id || !newVerifier.department) return
    const { data, error } = await supabase.from('certificate_verifiers').insert({
      faculty_id: newVerifier.faculty_id, department: newVerifier.department, assigned_by: userId,
    }).select('*, faculty:profiles(full_name,department)').single()
    if (!error && data) { setVerifiers(p => [...p, data]); setNewVerifier({ faculty_id:'', department:'' }) }
  }

  const removeVerifier = async (vid: string) => {
    await supabase.from('certificate_verifiers').delete().eq('id', vid)
    setVerifiers(p => p.filter(v => v.id !== vid))
  }

  const filteredUsers = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q)
  })

  if (loading) return <div className="page-loading"><div className="spinner"/></div>

  const stats = [
    { label:'Total Users', value:users.length, color:'var(--blue)' },
    { label:'Communities', value:communities.length, color:'var(--amber)' },
    { label:'Pending Certs', value:users.length, color:'var(--red)' },
    { label:'Verifiers', value:verifiers.length, color:'var(--green)' },
  ]

  return (
    <div className="page">
      <div className="fade-up" style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Admin Panel</h1>
        <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>Manage users, roles, and platform settings</p>
      </div>

      <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'24px' }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding:'16px', textAlign:'center' }}>
            <p style={{ fontSize:'28px', fontWeight:800, color:s.color, margin:'0 0 4px', lineHeight:1 }}>{s.value}</p>
            <p style={{ color:'var(--text3)', fontSize:'11px', margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="fade-up-2" style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
        {(['users','communities','verifiers'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          <input className="input" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:'300px', marginBottom:'14px' }} />
          <div className="card" style={{ overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Name','Email','Dept','Sem','Role','Status'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:'11px', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'12px 16px', color:'var(--text)', fontWeight:600, fontSize:'13px' }}>{u.full_name || '—'}</td>
                      <td style={{ padding:'12px 16px', color:'var(--text2)', fontSize:'12px' }}>{u.email}</td>
                      <td style={{ padding:'12px 16px', color:'var(--text2)', fontSize:'13px' }}>{u.department || '—'}</td>
                      <td style={{ padding:'12px 16px', color:'var(--text2)', fontSize:'13px' }}>{u.semester ? `S${u.semester}` : '—'}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <select value={u.role || 'student'} onChange={e => changeRole(u.id, e.target.value)}
                          className="input" style={{ padding:'5px 8px', fontSize:'12px', width:'auto' }}>
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="community_admin">Community Admin</option>
                          <option value="system_admin">System Admin</option>
                        </select>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span className={`badge ${u.is_profile_complete ? 'badge-green' : 'badge-gray'}`}>
                          {u.is_profile_complete ? 'Complete' : 'Incomplete'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'communities' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {communities.map(c => (
            <div key={c.id} className="card" style={{ padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
              <div>
                <p style={{ fontWeight:600, color:'var(--text)', fontSize:'14px', margin:'0 0 4px' }}>{c.name}</p>
                <p style={{ color:'var(--text3)', fontSize:'12px', margin:0 }}>
                  {c.type} · {c.category || '—'} · {c.department || 'All'} · by {c.creator?.full_name || '—'}
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                <button onClick={() => toggleCommunity(c.id, c.is_active)} className="btn btn-secondary btn-sm">
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'verifiers' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div className="card" style={{ padding:'20px' }}>
            <p style={{ fontWeight:700, color:'var(--text)', fontSize:'13px', margin:'0 0 14px' }}>Assign Certificate Verifier</p>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end' }}>
              <div>
                <label className="label">Faculty</label>
                <select className="input" value={newVerifier.faculty_id} onChange={e => setNewVerifier(p => ({ ...p, faculty_id:e.target.value }))} style={{ width:'200px' }}>
                  <option value="">Select faculty</option>
                  {facultyList.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.department})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input" value={newVerifier.department} onChange={e => setNewVerifier(p => ({ ...p, department:e.target.value }))} style={{ width:'140px' }}>
                  <option value="">Select</option>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={addVerifier} className="btn btn-primary btn-sm">Assign</button>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {verifiers.length === 0 ? (
              <div className="empty-state"><div className="icon">👨‍🏫</div><p>No verifiers assigned yet</p></div>
            ) : verifiers.map(v => (
              <div key={v.id} className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                <div>
                  <p style={{ fontWeight:600, color:'var(--text)', fontSize:'13px', margin:'0 0 2px' }}>{v.faculty?.full_name}</p>
                  <p style={{ color:'var(--text3)', fontSize:'12px', margin:0 }}>Verifies certificates for <strong style={{ color:'var(--text2)' }}>{v.department}</strong></p>
                </div>
                <button onClick={() => removeVerifier(v.id)} className="btn btn-danger btn-sm">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}