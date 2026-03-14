'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function CommunityManagePage() {
  const { id } = useParams()
  const router = useRouter()
  const [community, setCommunity] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [tab, setTab] = useState<'announcements' | 'members'>('announcements')
  const [loading, setLoading] = useState(true)

  // Announcement form
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annExpiry, setAnnExpiry] = useState('')
  const [savingAnn, setSavingAnn] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: comm } = await supabase.from('communities').select('*').eq('id', id).single()
      setCommunity(comm)

      // Check admin
      const { data: myRole } = await supabase.from('community_members')
        .select('role').eq('community_id', id).eq('profile_id', user.id).single()
      if (myRole?.role !== 'admin') { router.push(`/communities/${id}`); return }

      const { data: mems } = await supabase.from('community_members')
        .select('*, profiles(full_name, email, roll_number, departments(name))')
        .eq('community_id', id)
      setMembers(mems || [])

      const { data: anns } = await supabase.from('announcements')
        .select('*').eq('community_id', id).order('created_at', { ascending: false })
      setAnnouncements(anns || [])

      setLoading(false)
    }
    load()
  }, [id])

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim()) return
    setSavingAnn(true)
    const { data } = await supabase.from('announcements').insert({
      community_id: id,
      title: annTitle.trim(),
      content: annContent.trim(),
      created_by: userId,
      is_pinned: true,
      expires_at: annExpiry || null,
    }).select().single()
    if (data) setAnnouncements(prev => [data, ...prev])
    setAnnTitle(''); setAnnContent(''); setAnnExpiry('')
    setSavingAnn(false)
  }

  const handleUnpin = async (annId: string) => {
    await supabase.from('announcements').update({ is_pinned: false }).eq('id', annId)
    setAnnouncements(prev => prev.filter(a => a.id !== annId))
  }

  const handleDeleteAnn = async (annId: string) => {
    await supabase.from('announcements').delete().eq('id', annId)
    setAnnouncements(prev => prev.filter(a => a.id !== annId))
  }

  const handlePromote = async (profileId: string) => {
    await supabase.from('community_members').update({ role: 'admin' }).eq('community_id', id).eq('profile_id', profileId)
    setMembers(prev => prev.map(m => m.profile_id === profileId ? { ...m, role: 'admin' } : m))
  }

  const handleDemote = async (profileId: string) => {
    await supabase.from('community_members').update({ role: 'member' }).eq('community_id', id).eq('profile_id', profileId)
    setMembers(prev => prev.map(m => m.profile_id === profileId ? { ...m, role: 'member' } : m))
  }

  const handleRemove = async (profileId: string) => {
    await supabase.from('community_members').delete().eq('community_id', id).eq('profile_id', profileId)
    setMembers(prev => prev.filter(m => m.profile_id !== profileId))
  }

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></main>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Manage · {community?.name}</h1>
            <p className="page-subtitle">Community admin panel</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/communities/${id}/scout`} className="btn btn-primary">🔍 Scout Members</Link>
            <Link href={`/communities/${id}/events/create`} className="btn btn-ghost">+ Create Event</Link>
            <Link href={`/communities/${id}`} className="btn btn-ghost">← Back</Link>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'announcements' ? 'active' : ''}`} onClick={() => setTab('announcements')}>
            Announcements ({announcements.length})
          </button>
          <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
            Members ({members.length})
          </button>
        </div>

        {tab === 'announcements' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Create announcement */}
            <div>
              <h3 style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                New Announcement
              </h3>
              <div className="card">
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input className="input" placeholder="Announcement title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Content *</label>
                  <textarea className="input" placeholder="Write your announcement..." value={annContent} onChange={e => setAnnContent(e.target.value)} style={{ minHeight: '100px' }} />
                </div>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">Expires On <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                  <input type="date" className="input" value={annExpiry} onChange={e => setAnnExpiry(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handleCreateAnnouncement} disabled={savingAnn} style={{ width: '100%', justifyContent: 'center' }}>
                  {savingAnn ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </div>

            {/* Existing announcements */}
            <div>
              <h3 style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active Announcements
              </h3>
              {announcements.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px' }}><div className="empty-title">No announcements yet</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {announcements.map(ann => (
                    <div key={ann.id} className="card" style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{ann.title}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleUnpin(ann.id)} style={{ padding: '3px 8px', fontSize: '11px' }}>Unpin</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAnn(ann.id)} style={{ padding: '3px 8px', fontSize: '11px' }}>Delete</button>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>{ann.content?.slice(0, 80)}...</p>
                      {ann.expires_at && <div style={{ fontSize: '11px', color: 'var(--yellow)', marginTop: '6px' }}>Expires {new Date(ann.expires_at).toLocaleDateString()}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map(m => (
              <div key={m.profile_id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{m.profiles?.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{m.profiles?.email} · {m.profiles?.departments?.name}</div>
                </div>
                <span className={`badge ${m.role === 'admin' ? 'badge-purple' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                  {m.role}
                </span>
                {m.profile_id !== userId && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {m.role === 'member' ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => handlePromote(m.profile_id)} style={{ fontSize: '11px' }}>Make Admin</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDemote(m.profile_id)} style={{ fontSize: '11px' }}>Demote</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.profile_id)} style={{ fontSize: '11px' }}>Remove</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}