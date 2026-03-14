'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => setDepartments(data || []))
  }, [])

  const handleAdd = async () => {
    if (!name.trim() || !code.trim()) { setError('Name and code are required'); return }
    setSaving(true); setError('')
    const { data, error } = await supabase.from('departments').insert({ name: name.trim(), code: code.trim().toUpperCase() }).select().single()
    if (error) { setError(error.message); setSaving(false); return }
    setDepartments(prev => [...prev, data])
    setName(''); setCode(''); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department? This may affect batches and students linked to it.')) return
    await supabase.from('departments').delete().eq('id', id)
    setDepartments(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{departments.length} departments configured</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px' }}>
          {/* Add form */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Add Department</h3>
            <div className="card">
              <div className="input-group">
                <label className="input-label">Department Name</label>
                <input className="input" placeholder="Computer Science & Engineering" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label">Short Code</label>
                <input className="input" placeholder="CSE" value={code} onChange={e => setCode(e.target.value)} maxLength={10} />
              </div>
              {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '10px' }}>{error}</div>}
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                {saving ? 'Adding...' : '+ Add Department'}
              </button>
            </div>
          </div>

          {/* List */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Existing Departments</h3>
            {departments.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}><div className="empty-title">No departments yet</div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {departments.map(d => (
                  <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                    <span className="badge badge-blue mono">{d.code}</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: '500' }}>{d.name}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)} style={{ fontSize: '11px' }}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}