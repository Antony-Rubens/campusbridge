'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase, BANNER_GRADIENTS, BANNER_PATTERNS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function CommunityDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [community, setCommunity] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState<'feed' | 'events' | 'members'>('feed')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: comm } = await supabase
        .from('communities')
        .select('*, departments(name), faculty_advisor:faculty_advisor_id(full_name)')
        .eq('id', id)
        .single()
      setCommunity(comm)

      const { data: ann } = await supabase
        .from('announcements')
        .select('*, creator:created_by(full_name)')
        .eq('community_id', id)
        .eq('is_pinned', true)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
      setAnnouncements(ann || [])

      const { data: evts } = await supabase
        .from('events')
        .select('*')
        .eq('community_id', id)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
      setEvents(evts || [])

      const { data: mems } = await supabase
        .from('community_members')
        .select('*, profiles(full_name, email, role, department_id, departments(name))')
        .eq('community_id', id)
        .order('role', { ascending: false })
      setMembers(mems || [])

      const myMembership = mems?.find(m => m.profile_id === user.id)
      setIsMember(!!myMembership)
      setIsAdmin(myMembership?.role === 'admin')

      setLoading(false)
    }
    load()
  }, [id])

  const handleJoin = async () => {
    setJoining(true)
    await supabase.from('community_members').insert({ community_id: id, profile_id: userId, role: 'member' })
    setIsMember(true)
    setJoining(false)
  }

  const handleLeave = async () => {
    setJoining(true)
    await supabase.from('community_members').delete().eq('community_id', id).eq('profile_id', userId)
    setIsMember(false)
    setIsAdmin(false)
    setJoining(false)
  }

  if (loading) return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  if (!community) return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="empty-state"><div className="empty-title">Community not found</div></div>
      </main>
    </div>
  )

  const bi = community.banner_index ?? 0

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>
        {/* Banner */}
        <div style={{
          background: BANNER_GRADIENTS[bi % BANNER_GRADIENTS.length],
          height: '160px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '20px 32px',
          position: 'relative',
        }}>
          <div style={{ fontSize: '3rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', opacity: 0.3 }}>
            {BANNER_PATTERNS[bi % BANNER_PATTERNS.length]}
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{community.name}</h1>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge ${community.type === 'class' ? 'badge-yellow' : 'badge-blue'}`} style={{ fontSize: '10px' }}>{community.type}</span>
                {community.category && <span className="badge badge-gray" style={{ fontSize: '10px' }}>{community.category}</span>}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{members.length} members</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isAdmin && (
                <Link href={`/communities/${id}/manage`} className="btn btn-ghost btn-sm">⚙ Manage</Link>
              )}
              {community.type !== 'class' && (
                isMember ? (
                  <button className="btn btn-ghost btn-sm" onClick={handleLeave} disabled={joining}>
                    {joining ? '...' : 'Leave'}
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={handleJoin} disabled={joining}>
                    {joining ? '...' : 'Join'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {community.description && (
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px', maxWidth: '600px' }}>{community.description}</p>
          )}

          {/* Tabs */}
          <div className="tabs">
            {(['feed', 'events', 'members'] as const).map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'feed' && announcements.length > 0 && ` (${announcements.length})`}
                {t === 'events' && events.length > 0 && ` (${events.length})`}
                {t === 'members' && ` (${members.length})`}
              </button>
            ))}
          </div>

          {/* Feed tab */}
          {tab === 'feed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📌</div><div className="empty-title">No pinned announcements</div></div>
              ) : announcements.map(ann => (
                <div key={ann.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>📌 {ann.title}</div>
                    {ann.expires_at && <span className="badge badge-yellow" style={{ fontSize: '10px' }}>Exp {new Date(ann.expires_at).toLocaleDateString()}</span>}
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.6' }}>{ann.content}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
                    {ann.creator?.full_name} · {new Date(ann.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Events tab */}
          {tab === 'events' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">No upcoming events</div></div>
              ) : events.map(evt => (
                <Link key={evt.id} href={`/communities/${id}/events/${evt.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{evt.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                        📅 {new Date(evt.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {evt.venue && ` · 📍 ${evt.venue}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {evt.ktu_category && <span className="badge badge-blue" style={{ fontSize: '10px' }}>{evt.ktu_category}</span>}
                      <span className="badge badge-green">+{evt.suggested_points} pts</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Members tab */}
          {tab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map(m => (
                <div key={m.profile_id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: m.role === 'admin' ? '#a78bfa20' : 'var(--bg-4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '700',
                    color: m.role === 'admin' ? 'var(--purple)' : 'var(--text-3)',
                    flexShrink: 0,
                  }}>
                    {m.profiles?.full_name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{m.profiles?.full_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{m.profiles?.departments?.name}</div>
                  </div>
                  {m.role === 'admin' && <span className="badge badge-purple" style={{ fontSize: '10px' }}>Admin</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}