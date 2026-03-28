'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, KTU_TARGET_POINTS_2019, KTU_TARGET_POINTS_2024, KTU_TARGET_PER_GROUP_2024 } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function FacultyStudentsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [pointTotals, setPointTotals] = useState<Record<string, number>>({})
  const [groupTotals, setGroupTotals] = useState<Record<string, Record<number, number>>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, departments(name)')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      // Get all students assigned to this faculty coordinator
      const { data: studs } = await supabase
        .from('profiles')
        .select('id, full_name, roll_number, semester, scheme, departments(name), batches!profiles_batch_id_fkey(name)')
        .eq('role', 'student')
        .eq('faculty_coordinator_id', user.id)
        .order('full_name')
      setStudents(studs || [])

      if (studs && studs.length > 0) {
        const ids = studs.map(s => s.id)
        const { data: recs } = await supabase
          .from('activity_point_records')
          .select('profile_id, group_number, awarded_points')
          .in('profile_id', ids)

        const totals: Record<string, number> = {}
        const groups: Record<string, Record<number, number>> = {}

        recs?.forEach(r => {
          totals[r.profile_id] = (totals[r.profile_id] || 0) + r.awarded_points
          if (!groups[r.profile_id]) groups[r.profile_id] = { 1: 0, 2: 0, 3: 0 }
          if (r.group_number) {
            groups[r.profile_id][r.group_number] = (groups[r.profile_id][r.group_number] || 0) + r.awarded_points
          }
        })
        setPointTotals(totals)
        setGroupTotals(groups)
      }

      setLoading(false)
    }
    load()
  }, [])

  const isEligible = (student: any) => {
    const total = pointTotals[student.id] || 0
    const scheme = student.scheme ?? '2024'
    if (scheme === '2019') return total >= KTU_TARGET_POINTS_2019
    const g = groupTotals[student.id] || {}
    return (g[1] || 0) >= KTU_TARGET_PER_GROUP_2024 &&
           (g[2] || 0) >= KTU_TARGET_PER_GROUP_2024 &&
           (g[3] || 0) >= KTU_TARGET_PER_GROUP_2024
  }

  const filtered = students.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase())
  )

  const metCount = filtered.filter(s => isEligible(s)).length

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">My Students</h1>
          <p className="page-subtitle">{profile?.full_name} · {profile?.departments?.name}</p>
        </div>

        {/* Summary stats */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{metCount}</div>
            <div className="stat-label">Requirement Met</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{students.length - metCount}</div>
            <div className="stat-label">Still Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {students.length > 0
                ? Math.round(students.reduce((s, st) => s + (pointTotals[st.id] || 0), 0) / students.length)
                : 0}
            </div>
            <div className="stat-label">Avg Points</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            className="input"
            placeholder="Search by name or roll number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">
              {students.length === 0 ? 'No students assigned yet' : 'No students match your search'}
            </div>
            <div className="empty-desc">
              {students.length === 0
                ? 'Students will appear here once they select you as their faculty coordinator in their profile'
                : 'Try a different name or roll number'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(s => {
              const total = pointTotals[s.id] || 0
              const g = groupTotals[s.id] || {}
              const eligible = isEligible(s)
              const scheme = s.scheme ?? '2024'
              const is2024 = scheme === '2024'
              const required = is2024 ? KTU_TARGET_POINTS_2024 : KTU_TARGET_POINTS_2019
              const pct = Math.min((total / required) * 100, 100)
              const creditsEarned = is2024
                ? [1, 2, 3].filter(gi => (g[gi] || 0) >= KTU_TARGET_PER_GROUP_2024).length
                : null

              return (
                <Link key={s.id} href={`/faculty/students/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '14px 16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: 'var(--accent-glow)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {s.full_name?.charAt(0)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{s.full_name}</span>
                          <span className="badge badge-gray" style={{ fontSize: '10px' }}>{scheme}</span>
                          {eligible && <span className="badge badge-green" style={{ fontSize: '10px' }}>✓ Done</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>
                          {s.roll_number} · {s.departments?.name} · S{s.semester}
                        </div>
                        {/* Progress bar */}
                        <div className="progress-track" style={{ height: '4px' }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: eligible ? 'var(--green)' : undefined }} />
                        </div>
                      </div>

                      {/* Points */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: eligible ? 'var(--green)' : 'var(--accent)', lineHeight: 1 }}>
                          {total}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
                          {is2024
                            ? `${creditsEarned}/3 credits`
                            : `/ ${required} pts`}
                        </div>
                      </div>
                    </div>

                    {/* 2024: show per-group mini bars */}
                    {is2024 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingLeft: '52px' }}>
                        {[1, 2, 3].map(gi => {
                          const gpts = g[gi] || 0
                          const gmet = gpts >= KTU_TARGET_PER_GROUP_2024
                          return (
                            <div key={gi} style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>G{gi}</span>
                                <span style={{ fontSize: '10px', color: gmet ? 'var(--green)' : 'var(--text-3)', fontWeight: gmet ? '700' : '400' }}>
                                  {gpts}/40
                                </span>
                              </div>
                              <div className="progress-track" style={{ height: '3px' }}>
                                <div className="progress-fill" style={{
                                  width: `${Math.min((gpts / 40) * 100, 100)}%`,
                                  background: gmet ? 'var(--green)' : undefined
                                }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}