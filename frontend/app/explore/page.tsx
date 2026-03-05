'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ExplorePage() {
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const { data } = await supabase.from('profiles')
        .select('id,full_name,department,semester,batch,skills,interests,github_link,linkedin_id')
        .eq('is_profile_complete', true)
        .order('full_name')
      setStudents(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const depts = [...new Set(students.map(s => s.department).filter(Boolean))]
  const filtered = students.filter(s => {
    if (deptFilter && s.department !== deptFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return s.full_name?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.skills?.some((sk: string) => sk.toLowerCase().includes(q)) ||
      s.interests?.some((i: string) => i.toLowerCase().includes(q))
  })

  return (
    <div className="page">
      <div className="fade-up" style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Explore Students</h1>
        <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>{students.length} students on campus</p>
      </div>
      <div className="fade-up-1" style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        <input className="input" placeholder="Search by name, skills, interests…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:'280px' }} />
        <select className="input" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ maxWidth:'160px' }}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'12px' }}>
          {[...Array(8)].map((_,i) => <div key={i} className="card" style={{ height:'140px', opacity:.4 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><p>No students found</p></div>
      ) : (
        <div className="fade-up-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'12px' }}>
          {filtered.map(s => (
            <Link key={s.id} href={`/explore/${s.id}`} className="card card-hover" style={{ padding:'18px', textDecoration:'none', display:'block' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                <div className="avatar" style={{ width:40, height:40, fontSize:15 }}>{s.full_name?.[0] ?? '?'}</div>
                <div>
                  <p style={{ fontWeight:700, color:'var(--text)', fontSize:'14px', margin:'0 0 2px' }}>{s.full_name}</p>
                  <p style={{ color:'var(--text3)', fontSize:'12px', margin:0 }}>{s.department}{s.semester ? ` · S${s.semester}` : ''}</p>
                </div>
              </div>
              {s.skills?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {s.skills.slice(0,3).map((sk: string) => <span key={sk} className="badge badge-blue" style={{ fontSize:'10px' }}>{sk}</span>)}
                  {s.skills.length > 3 && <span className="badge badge-gray" style={{ fontSize:'10px' }}>+{s.skills.length - 3}</span>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}