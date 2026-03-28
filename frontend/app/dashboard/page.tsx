'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [points, setPoints] = useState({ total: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, departments(name), batches!profiles_batch_id_fkey(name), faculty:faculty_coordinator_id(full_name)')
        .eq('id', user.id)
        .single()

      if (!prof) { setLoading(false); return }
      setProfile(prof)

      // Get joined community IDs
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('profile_id', user.id)

      const communityIds = memberships?.map(m => m.community_id) || []

      if (communityIds.length > 0) {
        const now = new Date().toISOString()
        const { data: ann } = await supabase
          .from('announcements')
          .select('*, communities(name)')
          .in('community_id', communityIds)
          .eq('is_pinned', true)
          .or(`expires_at.is.null,expires_at.gte.${now}`)
          .order('created_at', { ascending: false })
          .limit(5)
        setAnnouncements(ann || [])

        const { data: evts } = await supabase
          .from('events')
          .select('*, communities(name)')
          .in('community_id', communityIds)
          .gte('event_date', now)
          .order('event_date', { ascending: true })
          .limit(6)
        setEvents(evts || [])
      }

      // Points
      const { data: ptRecords } = await supabase
        .from('activity_point_records')
        .select('awarded_points')
        .eq('profile_id', user.id)

      const total = ptRecords?.reduce((s, r) => s + r.awarded_points, 0) || 0

      const { count: pendingCount } = await supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('status', 'pending')

      setPoints({ total, pending: pendingCount || 0 })

      // Recent cert activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentCerts } = await supabase
        .from('certificates')
        .select('id, title, status, reviewed_at, awarded_points')
        .eq('profile_id', user.id)
        .in('status', ['approved', 'rejected'])
        .gte('reviewed_at', sevenDaysAgo)
        .order('reviewed_at', { ascending: false })
        .limit(5)

      setActivity(recentCerts || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  const totalPts = points.total
  const is2024 = profile?.scheme === '2024'
  const KTU_REQUIRED = is2024 ? 120 : 100
  const progressPct = Math.min((totalPts / KTU_REQUIRED) * 100, 100)

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="page-subtitle">
            {[profile?.departments?.name, profile?.batches?.name, profile?.semester ? `S${profile.semester}` : null].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{totalPts}</div>
            <div className="stat-label">Activity Points</div>
            <div className="progress-track" style={{ marginTop: '10px' }}>
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
              {totalPts >= KTU_REQUIRED ? '✓ Requirement met' : `${KTU_REQUIRED - totalPts} more to reach ${KTU_REQUIRED}`}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{points.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Upcoming Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{announcements.length}</div>
            <div className="stat-label">Pinned Notices</div>
          </div>
        </div>

        {!profile?.faculty_coordinator_id && (
          <div style={{
            background: 'var(--yellow-glow)', border: '1px solid #f5c54220',
            borderRadius: 'var(--radius)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '24px', fontSize: '13px',
          }}>
            <span>⚠️</span>
            <span style={{ color: 'var(--text-2)' }}>
              No faculty coordinator assigned. Your certificates cannot be reviewed.{' '}
              <Link href="/profile" style={{ color: 'var(--yellow)', fontWeight: '600' }}>Fix in profile →</Link>
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Announcements & Events UI remains identical to your design */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📌 Pinned Announcements
              </h3>
            </div>
            {announcements.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="empty-icon">📌</div>
                  <div className="empty-title">No announcements</div>
                  <div className="empty-desc">Join communities to see pinned notices here</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {announcements.map(ann => (
                  <div key={ann.id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{ann.title}</div>
                      {ann.expires_at && (
                        <span className="badge badge-yellow" style={{ flexShrink: 0, fontSize: '10px' }}>
                          Exp {new Date(ann.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px', lineHeight: '1.5' }}>
                      {ann.content?.length > 120 ? ann.content.slice(0, 120) + '…' : ann.content}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      {ann.communities?.name} · {new Date(ann.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📅 Upcoming Events
              </h3>
              <Link href="/discover" style={{ fontSize: '12px', color: 'var(--accent)' }}>See all →</Link>
            </div>
            {events.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="empty-icon">📅</div>
                  <div className="empty-title">No upcoming events</div>
                  <div className="empty-desc">Events from your communities appear here</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {events.slice(0, 5).map(evt => (
                  <Link key={evt.id} href={`/communities/${evt.community_id}/events/${evt.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{evt.title}</div>
                        <span className="badge badge-green">+{evt.suggested_points} pts</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        {evt.communities?.name} · {new Date(evt.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {activity.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              🔔 Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activity.map(cert => (
                <div key={cert.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`dot dot-${cert.status === 'approved' ? 'green' : 'red'}`} />
                  <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1 }}>{cert.title}</span>
                  <span className={`badge badge-${cert.status === 'approved' ? 'green' : 'red'}`}>
                    {cert.status === 'approved' ? `+${cert.awarded_points} pts` : 'Rejected'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    {new Date(cert.reviewed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/certificates/upload" className="btn btn-primary">+ Upload Certificate</Link>
          <Link href="/communities" className="btn btn-ghost">Browse Communities</Link>
          <Link href="/activity-points" className="btn btn-ghost">View Points Breakdown</Link>
        </div>
      </main>
    </div>
  )
}