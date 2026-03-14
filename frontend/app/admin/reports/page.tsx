'use client'

import { useEffect, useState } from 'react'
import { supabase, KTU_CATEGORIES, KTU_TARGET_POINTS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminReportsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [pointTotals, setPointTotals] = useState<Record<string, number>>({})
  const [catTotals, setCatTotals] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const [{ data: studs }, { data: depts }, { data: bats }] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, email, roll_number, semester, scheme, departments(id, name), batches(id, name)')
          .eq('role', 'student')
          .order('full_name'),
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('batches').select('id, name').order('name'),
      ])
      setStudents(studs || [])
      setDepartments(depts || [])
      setBatches(bats || [])

      if (studs && studs.length > 0) {
        const ids = studs.map(s => s.id)
        const { data: recs } = await supabase
          .from('activity_point_records')
          .select('profile_id, category, awarded_points')
          .in('profile_id', ids)

        const totals: Record<string, number> = {}
        const cats: Record<string, Record<string, number>> = {}

        recs?.forEach(r => {
          totals[r.profile_id] = (totals[r.profile_id] || 0) + r.awarded_points
          if (!cats[r.profile_id]) cats[r.profile_id] = {}
          cats[r.profile_id][r.category] = (cats[r.profile_id][r.category] || 0) + r.awarded_points
        })
        setPointTotals(totals)
        setCatTotals(cats)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(search.toLowerCase())
    const matchDept = !filterDept || s.departments?.id === filterDept
    const matchBatch = !filterBatch || s.batches?.id === filterBatch
    return matchSearch && matchDept && matchBatch
  })

  const metCount = filtered.filter(s => (pointTotals[s.id] || 0) >= KTU_TARGET_POINTS).length

  const exportCSV = () => {
    const headers = ['Name', 'Roll No', 'Department', 'Batch', 'Semester', 'Scheme', 'Total Points', ...KTU_CATEGORIES]
    const rows = filtered.map(s => [
      s.full_name, s.roll_number || '', s.departments?.name || '', s.batches?.name || '',
      s.semester || '', s.scheme || '',
      pointTotals[s.id] || 0,
      ...KTU_CATEGORIES.map(cat => catTotals[s.id]?.[cat] || 0),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'campusbridge_activity_report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Activity Point Reports</h1>
            <p className="page-subtitle">Platform-wide KTU activity point summary</p>
          </div>
          <button className="btn btn-ghost" onClick={exportCSV}>↓ Export CSV</button>
        </div>

        {/* Summary stats */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value">{filtered.length}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{metCount}</div>
            <div className="stat-label">Requirement Met</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{filtered.length - metCount}</div>
            <div className="stat-label">Still Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{filtered.length > 0 ? Math.round(filtered.reduce((s, st) => s + (pointTotals[st.id] || 0), 0) / filtered.length) : 0}</div>
            <div className="stat-label">Avg Points</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="Search by name or roll number..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '260px' }} />
          <select className="input" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ maxWidth: '200px' }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="input" value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ maxWidth: '200px' }}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="spinner" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Student', 'Dept', 'Batch', 'Total', ...KTU_CATEGORIES, 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-3)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const total = pointTotals[s.id] || 0
                  const met = total >= KTU_TARGET_POINTS
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: '600' }}>{s.full_name}</div>
                        <div style={{ color: 'var(--text-3)', fontSize: '11px' }}>{s.roll_number}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{s.departments?.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{s.batches?.name}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: met ? 'var(--green)' : total > 50 ? 'var(--yellow)' : 'var(--text)' }}>
                        {total}
                      </td>
                      {KTU_CATEGORIES.map(cat => (
                        <td key={cat} style={{ padding: '10px 12px', color: 'var(--text-2)' }}>
                          {catTotals[s.id]?.[cat] || 0}
                        </td>
                      ))}
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge badge-${met ? 'green' : 'yellow'}`} style={{ fontSize: '10px' }}>
                          {met ? '✓ Met' : `${KTU_TARGET_POINTS - total} left`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5 + KTU_CATEGORIES.length} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}