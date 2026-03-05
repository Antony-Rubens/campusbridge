'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CommunitiesPage() {
  const router = useRouter()
  const [all, setAll] = useState<any[]>([])
  const [myIds, setMyIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)

      const { data: comms, error: e } = await supabase
        .from('communities')
        .select('id, name, description, type, category, department, created_by, is_active')
        .eq('is_active', true)
        .order('name')

      if (e) { setError(e.message); setLoading(false); return }
      setAll(comms ?? [])

      const { data: mems } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('profile_id', session.user.id)

      setMyIds(new Set((mems ?? []).map((m) => m.community_id)))
      setLoading(false)
    }
    load()
  }, [router])

  const join = async (id) => {
    await supabase.from('community_members').insert({ community_id: id, profile_id: userId })
    setMyIds(p => new Set([...p, id]))
  }

  const leave = async (id) => {
    await supabase.from('community_members').delete().eq('community_id', id).eq('profile_id', userId)
    setMyIds(p => { const s = new Set(p); s.delete(id); return s })
  }

  const filtered = all.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q)
  })

  return (
    <div className="page">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Communities</h1>
          <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>{loading ? 'Loading...' : all.length + ' communities'}</p>
        </div>
        <Link href="/communities/create" className="btn btn-primary">+ New Community</Link>
      </div>

      <input className="input" placeholder="Search..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ maxWidth:'280px', marginBottom:'20px' }} />

      {error && <div className="error-box" style={{ marginBottom:'16px' }}>Error: {error}</div>}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}>
          <div className="spinner" />
        </div>
      ) : all.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏘</div>
          <p>No communities found</p>
          <Link href="/communities/create" className="btn btn-primary btn-sm" style={{ marginTop:'12px' }}>Create one</Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'12px' }}>
          {filtered.map(c => {
            const isMember = myIds.has(c.id)
            const isOwner = c.created_by === userId
            return (
              <div key={c.id} className="card card-hover" style={{ padding:'18px', display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'flex', gap:'6px', marginBottom:'6px', flexWrap:'wrap' }}>
                      <span className="badge badge-gray">{c.type ?? 'general'}</span>
                      {c.category && <span className="badge badge-amber">{c.category}</span>}
                    </div>
                    <p style={{ fontWeight:700, color:'var(--text)', fontSize:'14px', margin:'0 0 2px' }}>{c.name}</p>
                    {c.department && <p style={{ color:'var(--text3)', fontSize:'12px', margin:0 }}>{c.department}</p>}
                  </div>
                  {isOwner && (
                    <Link href={'/communities/' + c.id + '/manage'} style={{ color:'var(--text3)', textDecoration:'none', fontSize:'16px' }}>⚙</Link>
                  )}
                </div>
                {c.description && (
                  <p style={{ color:'var(--text2)', fontSize:'12px', margin:0, overflow:'hidden' }}>{c.description}</p>
                )}
                <div style={{ display:'flex', gap:'8px', marginTop:'auto' }}>
                  <Link href={'/communities/' + c.id} className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:'center' }}>View</Link>
                  {!isOwner && (
                    <button onClick={() => isMember ? leave(c.id) : join(c.id)}
                      className={'btn btn-sm ' + (isMember ? 'btn-danger' : 'btn-primary')} style={{ flex:1 }}>
                      {isMember ? 'Leave' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
