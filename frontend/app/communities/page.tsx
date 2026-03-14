'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, BANNER_GRADIENTS, BANNER_PATTERNS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function CommunitiesPage() {
  const router = useRouter()
  const [communities, setCommunities] = useState<any[]>([])
  const [myIds, setMyIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: comms } = await supabase
        .from('communities')
        .select('*, departments(name), community_members(profile_id, role)')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('profile_id', user.id)

      const ids = new Set(memberships?.map(m => m.community_id) || [])
      setMyIds(ids)
      setCommunities(comms || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleJoin = async (communityId: string, type: string) => {
    if (type === 'class') return // can't manually join class communities
    setJoining(communityId)
    await supabase.from('community_members').insert({
      community_id: communityId,
      profile_id: userId,
      role: 'member',
    })
    setMyIds(prev => new Set([...prev, communityId]))
    setJoining(null)
  }

  const handleLeave = async (communityId: string) => {
    setJoining(communityId)
    await supabase.from('community_members').delete()
      .eq('community_id', communityId)
      .eq('profile_id', userId)
    setMyIds(prev => { const s = new Set(prev); s.delete(communityId); return s })
    setJoining(null)
  }

  const filtered = communities.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || c.type === filterType
    return matchSearch && matchType
  })

  const memberCount = (c: any) => c.community_members?.length || 0
  const isAdmin = (c: any) => c.community_members?.some((m: any) => m.profile_id === userId && m.role === 'admin')

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Communities</h1>
            <p className="page-subtitle">Join clubs, departments and groups on campus</p>
          </div>
          <Link href="/communities/create" className="btn btn-primary">+ New Community</Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search communities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '280px' }}
          />
          <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: '160px' }}>
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="class">Class</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◉</div>
            <div className="empty-title">No communities found</div>
            <div className="empty-desc">Be the first to create one</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {filtered.map(c => {
              const bi = c.banner_index ?? 0
              const isMember = myIds.has(c.id)
              const amAdmin = isAdmin(c)
              return (
                <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <Link href={`/communities/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: BANNER_GRADIENTS[bi % BANNER_GRADIENTS.length],
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                    }}>
                      {BANNER_PATTERNS[bi % BANNER_PATTERNS.length]}
                    </div>
                    <div style={{ padding: '14px 16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', lineHeight: '1.3' }}>{c.name}</div>
                        {amAdmin && <span className="badge badge-purple" style={{ fontSize: '10px', flexShrink: 0 }}>Admin</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span className={`badge ${c.type === 'class' ? 'badge-yellow' : 'badge-blue'}`} style={{ fontSize: '10px' }}>
                          {c.type}
                        </span>
                        {c.category && <span className="badge badge-gray" style={{ fontSize: '10px' }}>{c.category}</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        {memberCount(c)} member{memberCount(c) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding: '0 16px 14px', display: 'flex', gap: '8px' }}>
                    {c.type !== 'class' && (
                      isMember ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={joining === c.id}
                          onClick={() => handleLeave(c.id)}
                          style={{ flex: 1 }}
                        >
                          {joining === c.id ? '...' : 'Leave'}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={joining === c.id}
                          onClick={() => handleJoin(c.id, c.type)}
                          style={{ flex: 1 }}
                        >
                          {joining === c.id ? '...' : 'Join'}
                        </button>
                      )
                    )}
                    {amAdmin && (
                      <Link href={`/communities/${c.id}/manage`} className="btn btn-ghost btn-sm">
                        ⚙
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}