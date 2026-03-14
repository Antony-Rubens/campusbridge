'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [faculty, setFaculty] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [deptId, setDeptId] = useState('')
  const [semester, setSemester] = useState('1')
  const [scheme, setScheme] = useState<'2019' | '2025'>('2025')
  const [academicYear, setAcademicYear] = useState('')
  const [coordinatorId, setCoordinatorId] = useState('')

  useEffect(() => {
    const load = async () => {
      const [{ data: b }, { data: d }, { data: f }] = await Promise.all([
        supabase.from('batches').select('*, departments(name, code), faculty_coordinator:faculty_coordinator_id(full_name)').order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('name'),
        supabase.from('profiles').select('id, full_name').eq('role', 'faculty').order('full_name'),
      ])
      setBatches(b || [])
      setDepartments(d || [])
      setFaculty(f || [])
    }
    load()
  }, [])

  const handleCreate = async () => {
    if (!name.trim() || !deptId || !academicYear.trim()) { setError('Name, department and academic year are required'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('batches').insert({
      name: name.trim(),
      department_id: deptId,
      semester: parseInt(semester),
      scheme,
      academic_year: academicYear.trim(),
      faculty_coordinator_id: coordinatorId || null,
      is_graduated: false,
    }).select('*, departments(name, code), faculty_coordinator:faculty_coordinator_id(full_name)').single()

    if (err) { setError(err.message); setSaving(false); return }

    // Auto-create class community for this batch
    const { data: comm } = await supabase.from('communities').insert({
      name: data.name,
      type: 'class',
      department_id: deptId,
      batch_id: data.id,
      created_by: null,
      status: 'approved',
      is_active: true,
      banner_index: 6,
    }).select().single()

    setBatches(prev => [data, ...prev])
    setName(''); setDeptId(''); setAcademicYear(''); setCoordinatorId(''); setSaving(false)
  }

  const handleAdvance = async (batch: any) => {
    if (batch.semester >= 8) {
      if (!confirm(`Batch is at S8. Mark as graduated?`)) return
      await supabase.from('batches').update({ is_graduated: true }).eq('id', batch.id)
      setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, is_graduated: true } : b))
      return
    }
    if (!confirm(`Advance ${batch.name} from S${batch.semester} to S${batch.semester + 1}?`)) return
    setAdvancing(batch.id)
    const newSem = batch.semester + 1
    const newName = batch.name.replace(`S${batch.semester}`, `S${newSem}`)

    await supabase.from('batches').update({ semester: newSem, name: newName }).eq('id', batch.id)
    // Update all students in batch
    await supabase.from('profiles').update({ semester: newSem }).eq('batch_id', batch.id)
    // Update class community name
    await supabase.from('communities').update({ name: newName }).eq('batch_id', batch.id).eq('type', 'class')

    setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, semester: newSem, name: newName } : b))
    setAdvancing(null)
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">{batches.filter(b => !b.is_graduated).length} active batches</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
          {/* Create form */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Create Batch</h3>
            <div className="card">
              <div className="input-group">
                <label className="input-label">Batch Name</label>
                <input className="input" placeholder="e.g. CSE S1 2025-29" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <select className="input" value={deptId} onChange={e => setDeptId(e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Semester</label>
                  <select className="input" value={semester} onChange={e => setSemester(e.target.value)}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>S{s}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">KTU Scheme</label>
                  <select className="input" value={scheme} onChange={e => setScheme(e.target.value as any)}>
                    <option value="2025">2025</option>
                    <option value="2019">2019</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Academic Year</label>
                <input className="input" placeholder="e.g. 2025-29" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label">Faculty Coordinator</label>
                <select className="input" value={coordinatorId} onChange={e => setCoordinatorId(e.target.value)}>
                  <option value="">Select faculty (optional)</option>
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                </select>
              </div>
              {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '10px' }}>{error}</div>}
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                {saving ? 'Creating...' : '+ Create Batch'}
              </button>
            </div>
          </div>

          {/* Batch list */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>All Batches</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {batches.map(b => (
                <div key={b.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', opacity: b.is_graduated ? 0.5 : 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{b.name}</span>
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>Scheme {b.scheme}</span>
                      {b.is_graduated && <span className="badge badge-purple" style={{ fontSize: '10px' }}>Graduated</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {b.departments?.name} · {b.academic_year}
                      {b.faculty_coordinator && ` · ${b.faculty_coordinator.full_name}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <span className="badge badge-blue" style={{ fontSize: '11px' }}>S{b.semester}</span>
                    {!b.is_graduated && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleAdvance(b)}
                        disabled={advancing === b.id}
                        style={{ fontSize: '11px' }}
                      >
                        {advancing === b.id ? '...' : b.semester >= 8 ? 'Graduate' : `→ S${b.semester + 1}`}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {batches.length === 0 && (
                <div className="empty-state" style={{ padding: '32px' }}><div className="empty-title">No batches yet</div></div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}