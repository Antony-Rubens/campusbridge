'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [csvStatus, setCsvStatus] = useState('')
  const [csvError, setCsvError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user?.id, user?.email)

      const result = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .limit(5)
      console.log('Profiles test - status:', result.status, 'statusText:', result.statusText)
      console.log('Profiles test - data:', result.data)
      console.log('Profiles test - error:', JSON.stringify(result.error))

      const [{ data: u, error: uErr }, { data: b }, { data: d }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, roll_number, semester, scheme, department_id, batch_id, departments(name), batches!profiles_batch_id_fkey(name)').order('full_name').limit(500),
        supabase.from('batches').select('id, name, department_id, scheme, semester').order('name'),
        supabase.from('departments').select('id, name, code').order('name'),
      ])
      if (uErr) console.error('Users fetch error:', JSON.stringify(uErr))
      console.log('Users count:', u?.length)
      setUsers(u || [])
      setBatches(b || [])
      setDepartments(d || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.roll_number?.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  const downloadTemplate = () => {
    const csv = 'full_name,email,roll_number,department_code,semester,academic_year,scheme,role\nAntony Rubens,antony@aisat.ac.in,AIK23CS032,CSE,5,2023-27,2019,student\nDr. John Faculty,john@aisat.ac.in,,CSE,,,2019,faculty'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'campusbridge_users_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setCsvStatus(''); setCsvError('')

    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = lines.slice(1)

    let created = 0; let failed = 0; const errors: string[] = []

    for (const row of rows) {
      if (!row.trim()) continue
      const vals = row.split(',').map(v => v.trim())
      const record: any = {}
      headers.forEach((h, i) => record[h] = vals[i] || '')

      if (!record.email) { failed++; errors.push(`Row missing email: ${row}`); continue }

      const dept = departments.find(d => d.code.toLowerCase() === record.department_code?.toLowerCase())
      const batch = record.role === 'student'
        ? batches.find(b => b.department_id === dept?.id && b.semester === parseInt(record.semester || '1'))
        : null

      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', record.email)
          .single()

        const profileId = existing?.id || crypto.randomUUID()

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: profileId,
          full_name: record.full_name,
          email: record.email,
          role: record.role || 'student',
          roll_number: record.roll_number || null,
          department_id: dept?.id || null,
          batch_id: batch?.id || null,
          semester: parseInt(record.semester) || null,
          scheme: record.scheme || batch?.scheme || '2025',
          is_profile_complete: false,
          skills: [],
        }, { onConflict: 'id' })

        if (profileError) throw profileError
        created++
      } catch (err: any) {
        failed++
        errors.push(`${record.email}: ${err.message}`)
      }
    }

    setCsvStatus(`✓ ${created} profiles created/updated. ${failed > 0 ? `${failed} failed.` : ''}`)
    if (errors.length) setCsvError(errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''))
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    window.location.reload()
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} total users on the platform</p>
        </div>

        <div className="card" style={{ marginBottom: '24px', borderColor: '#4f8ef720' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Bulk Upload Users via CSV
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>↓ Download Template</button>
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : '↑ Upload CSV'}
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            {csvStatus && <span style={{ fontSize: '12px', color: 'var(--green)' }}>{csvStatus}</span>}
          </div>
          {csvError && (
            <div style={{ marginTop: '10px', background: 'var(--red-glow)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '11px', color: 'var(--red)', whiteSpace: 'pre-line' }}>
              {csvError}
            </div>
          )}
          <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '10px' }}>
            CSV columns: full_name, email, roll_number, department_code, semester, academic_year, scheme, role
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="Search name, email or roll number..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '280px' }} />
          <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: '150px' }}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="system_admin">Admin</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px 120px 100px', gap: '12px', padding: '8px 16px', fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>User</span><span>Department</span><span>Roll No.</span><span>Batch</span><span>Role</span>
            </div>
            {filtered.map(u => (
              <div key={u.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px 120px 100px', gap: '12px', alignItems: 'center', padding: '12px 16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{u.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{u.email}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{u.departments?.name || '—'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace' }}>{u.roll_number || '—'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{u.batches?.name || '—'}</div>
                <select className="input" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} style={{ fontSize: '11px', padding: '4px 8px' }}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="system_admin">Admin</option>
                </select>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state"><div className="empty-title">No users found</div></div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}