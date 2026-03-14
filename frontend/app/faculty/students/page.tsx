'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, KTU_TARGET_POINTS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [pointTotals, setPointTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: studs } = await supabase
        .from('profiles')
        .select('id, full_name, email, roll_number, semester, scheme, departments(name), batches!profiles_batch_id_fkey(name)')
        .eq('faculty_coordinator_id', user.id)
        .eq('role', 'student')
        .order('full_name')
      setStudents(studs || [])

      if (studs && studs.length > 0) {
        const ids = studs.map(s => s.id)
        const { data: records } = await supabase
          .from('activity_point_records')
          .select('profile_id, awarded_points')
          .in('profile_id', ids)

        const totals: Record<string, number> = {}
        records?.forEach(r => {
          totals[r.profile_id] = (totals[r.profile_id] || 0) + r.awarded_points
        })
        setPointTotals(totals)
      }

      setLoading(false)
    }
    load()
  }, [])

  const filtered = students.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">My Students</h1>
          <p className="page-subtitle">{students.length} student{students.length !== 1 ? 's' : ''} assigned to you</p>
        </div>

        <input
          className="input"
          placeholder="Search by name or roll number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '320px', marginBottom: '20px' }}
        />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No students found</div>
            <div className="empty-desc">Students assigned to you will appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(s => {
              const total = pointTotals[s.id] || 0
              const pct = Math.min((total / KTU_TARGET_POINTS) * 100, 100)
              const met = total >= KTU_TARGET_POINTS
              return (
                <Link key={s.id} href={`/faculty/students/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: met ? 'var(--green-glow)' : 'var(--bg-4)',
                      color: met ? 'var(--green)' : 'var(--text-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', fontWeight: '700', flexShrink: 0,
                    }}>
                      {s.full_name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{s.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '6px' }}>
                        {s.roll_number} · {s.departments?.name} · S{s.semester} · Scheme {s.scheme}
                      </div>
                      <div className="progress-track" style={{ maxWidth: '240px' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: met ? 'var(--green)' : undefined }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: met ? 'var(--green)' : 'var(--text)' }}>
                        {total}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>/ {KTU_TARGET_POINTS} pts</div>
                      {met && <div style={{ fontSize: '10px', color: 'var(--green)' }}>✓ Complete</div>}
                    </div>
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