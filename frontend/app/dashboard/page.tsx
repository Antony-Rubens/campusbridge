'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [pendingCerts, setPendingCerts] = useState(0)
  const [myCommunities, setMyCommunities] = useState<any[]>([])
  const [facultyCoord, setFacultyCoord] = useState<any>(null)
  const [facultyCerts, setFacultyCerts] = useState(0)
  const [adminStats, setAdminStats] = useState({ users: 0, communities: 0, pendingCerts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const uid = session.user.id

      const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (!p?.is_profile_complete) { router.push('/register-details'); return }
      setProfile(p)

      if (p.role === 'system_admin') {
        const [u, c, ce] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('communities').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ])
        setAdminStats({ users: u.count ?? 0, communities: c.count ?? 0, pendingCerts: ce.count ?? 0 })
        setLoading(false)
        return
      }

      const [sumRes, certRes, commRes] = await Promise.all([
        supabase.from('activity_point_summary').select('*').eq('profile_id', uid).single(),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('profile_id', uid).eq('status', 'pending'),
        supabase.from('community_members').select('community_id, communities(id,name,type)').eq('profile_id', uid),
      ])
      setSummary(sumRes.data)
      setPendingCerts(certRes.count ?? 0)
      const comms = (commRes.data ?? []).map((m: any) => m.communities).filter(Boolean)
      setMyCommunities(comms)

      if (p.faculty_coordinator_id) {
        const { data: fc } = await supabase.from('profiles').select('full_name, department').eq('id', p.faculty_coordinator_id).single()
        setFacultyCoord(fc)
      }

      const communityIds = (commRes.data ?? []).map((m: any) => m.community_id)
      if (communityIds.length > 0) {
        const { data: ev } = await supabase.from('events')
          .select('*, communities(name)')
          .in('community_id', communityIds)
          .eq('is_published', true)
          .gte('event_date', new Date().toISOString())
          .order('event_date').limit(5)
        setEvents(ev ?? [])
      }

      if (p.role === 'faculty') {
        const { count } = await supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        setFacultyCerts(count ?? 0)
      }

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="page-loading"><div className="spinner" /></div>
  if (!profile) return null

  const pts = summary?.total_points ?? 0
  const max = summary?.max_allowed ?? 100
  const pct = Math.min((pts / max) * 100, 100)
  const isAdmin = profile.role === 'system_admin'
  const isFaculty = profile.role === 'faculty'

  // ── ADMIN DASHBOARD ──
  if (isAdmin) {
    return (
      <div className="page">
        <div className="fade-up" style={{ marginBottom: '28px' }}>
          <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 4px' }}>Signed in as</p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{profile.full_name}</h1>
          <span className="badge badge-amber">System Admin</span>
        </div>
        <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Total Users', value: adminStats.users, color: 'var(--blue)', href: '/admin' },
            { label: 'Active Communities', value: adminStats.communities, color: 'var(--amber)', href: '/admin' },
            { label: 'Certs Pending Review', value: adminStats.pendingCerts, color: adminStats.pendingCerts > 0 ? 'var(--red)' : 'var(--text)', href: '/faculty' },
          ].map(s => (
            <Link key={s.label} href={s.href} className="card card-hover" style={{ padding: '22px', textDecoration: 'none', display: 'block' }}>
              <p style={{ fontSize: '38px', fontWeight: 800, color: s.color, margin: '0 0 6px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: 'var(--text2)', fontSize: '12px', margin: 0 }}>{s.label}</p>
            </Link>
          ))}
        </div>
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '10px' }}>
          {[
            { href: '/admin', label: 'Manage Users & Roles', icon: '👥' },
            { href: '/admin', label: 'Manage Communities', icon: '🏘️' },
            { href: '/faculty', label: 'Review Certificates', icon: '📋' },
            { href: '/communities/create', label: 'Create Class Community', icon: '🎓' },
            { href: '/discover', label: 'Browse Events', icon: '📅' },
            { href: '/explore', label: 'Explore Students', icon: '🔍' },
          ].map(a => (
            <Link key={a.href + a.label} href={a.href} className="card card-hover" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <span style={{ fontSize: '20px' }}>{a.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // ── FACULTY DASHBOARD ──
  if (isFaculty) {
    return (
      <div className="page">
        <div className="fade-up" style={{ marginBottom: '28px' }}>
          <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 4px' }}>Welcome back,</p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{profile.full_name}</h1>
          <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>{profile.department} · <span className="badge badge-blue">Faculty</span></p>
        </div>
        <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px', marginBottom: '24px' }}>
          <Link href="/faculty" className="card card-hover" style={{ padding: '20px', textDecoration: 'none', display: 'block' }}>
            <p style={{ fontSize: '36px', fontWeight: 800, color: facultyCerts > 0 ? 'var(--red)' : 'var(--text)', margin: '0 0 6px', lineHeight: 1 }}>{facultyCerts}</p>
            <p style={{ color: 'var(--text2)', fontSize: '12px', margin: 0 }}>Certificates to Review</p>
          </Link>
          <Link href="/communities" className="card card-hover" style={{ padding: '20px', textDecoration: 'none', display: 'block' }}>
            <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', lineHeight: 1 }}>{myCommunities.length}</p>
            <p style={{ color: 'var(--text2)', fontSize: '12px', margin: 0 }}>My Communities</p>
          </Link>
        </div>
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: '14px' }}>Upcoming Events</h2>
            {events.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No upcoming events from your communities</p>
              </div>
            ) : events.map(ev => (
              <div key={ev.id} className="card card-hover" style={{ padding: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px', margin: '0 0 4px' }}>{ev.title}</p>
                  <p style={{ color: 'var(--text3)', fontSize: '12px', margin: 0 }}>{ev.communities?.name} · {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                {ev.activity_points > 0 && <span className="badge badge-amber">+{ev.activity_points} pts</span>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 className="section-title" style={{ marginBottom: '4px' }}>Quick Actions</h2>
            {[
              { href: '/faculty', label: 'Review Certificates', icon: '✅' },
              { href: '/communities', label: 'My Communities', icon: '🏘️' },
              { href: '/discover', label: 'Discover Events', icon: '📅' },
              { href: '/explore', label: 'Explore Students', icon: '👥' },
            ].map(a => (
              <Link key={a.href} href={a.href} className="card card-hover" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <span style={{ fontSize: '18px' }}>{a.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: '12px' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── STUDENT DASHBOARD ──
  return (
    <div className="page">
      <div className="fade-up" style={{ marginBottom: '28px' }}>
        <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 4px' }}>Welcome back,</p>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{profile.full_name}</h1>
        <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>
          {profile.department} · S{profile.semester}
          {profile.batch ? ` · ${profile.batch}` : ''}
        </p>
      </div>

      {/* Faculty coordinator card */}
      <div className="fade-up-1" style={{ marginBottom: '20px' }}>
        {facultyCoord ? (
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: 'var(--amber-border)' }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{facultyCoord.full_name?.[0]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: 'var(--text3)', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Your Faculty Coordinator</p>
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px', margin: 0 }}>{facultyCoord.full_name}</p>
            </div>
            <Link href="/profile" className="btn btn-ghost btn-xs">Change</Link>
          </div>
        ) : (
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: 'rgba(239,68,68,.2)' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', margin: '0 0 1px' }}>No faculty coordinator selected</p>
              <p style={{ color: 'var(--text3)', fontSize: '12px', margin: 0 }}>You need a coordinator to get certificates approved</p>
            </div>
            <Link href="/profile" className="btn btn-primary btn-sm">Select Now</Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <p style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>Activity Points</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--amber)', margin: '0 0 8px', lineHeight: 1 }}>
            {pts}<span style={{ fontSize: '14px', color: 'var(--text3)', fontWeight: 400 }}>/{max}</span>
          </p>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--amber)', borderRadius: '2px', transition: 'width .5s ease' }} />
          </div>
        </div>
        <Link href="/certificates" className="card card-hover" style={{ padding: '18px', textDecoration: 'none', display: 'block' }}>
          <p style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>Pending Certs</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color: pendingCerts > 0 ? 'var(--amber)' : 'var(--text)', margin: 0, lineHeight: 1 }}>{pendingCerts}</p>
        </Link>
        <Link href="/communities" className="card card-hover" style={{ padding: '18px', textDecoration: 'none', display: 'block' }}>
          <p style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>Communities</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1 }}>{myCommunities.length}</p>
        </Link>
      </div>

      <div className="fade-up-3" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Upcoming events */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 className="section-title">Upcoming Events</h2>
            <Link href="/discover" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {events.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '28px', marginBottom: '8px' }}>📅</p>
              <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '12px' }}>No upcoming events from your communities</p>
              <Link href="/communities" className="btn btn-secondary btn-sm">Browse communities</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.map(ev => (
                <div key={ev.id} className="card card-hover" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 4px', fontSize: '14px' }}>{ev.title}</p>
                    <p style={{ color: 'var(--text3)', fontSize: '12px', margin: '0 0 4px' }}>{ev.communities?.name} · {ev.location || 'TBD'}</p>
                    <p style={{ color: 'var(--text2)', fontSize: '12px', margin: 0 }}>
                      📅 {new Date(ev.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {ev.activity_points > 0 && <span className="badge badge-amber">+{ev.activity_points} pts</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions + communities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 className="section-title" style={{ marginBottom: '2px' }}>Quick Actions</h2>
          {[
            { href: '/certificates/upload', label: 'Upload Certificate', icon: '📎' },
            { href: '/communities', label: 'Browse Communities', icon: '🏘️' },
            { href: '/discover', label: 'Discover Events', icon: '🔍' },
            { href: '/activity-points', label: 'View My Points', icon: '🏅' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="card card-hover" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <span style={{ fontSize: '18px' }}>{a.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: '12px' }}>→</span>
            </Link>
          ))}

          {myCommunities.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <p style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 10px' }}>My Communities</p>
              {myCommunities.slice(0, 5).map((c: any) => (
                <Link key={c.id} href={`/communities/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                  <span className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{c.name?.[0]}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{c.name}</span>
                  <span className={`badge ${c.type === 'class' ? 'badge-blue' : 'badge-gray'}`} style={{ marginLeft: 'auto', fontSize: '10px' }}>{c.type ?? 'general'}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}