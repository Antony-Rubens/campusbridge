'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function Page() {
  const [list, setList] = useState<any[]>([])
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('communities')
      .select('*, departments(name), creator:created_by(full_name, email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setList(data || []); setLoading(false) })
  }, [])

  const filtered = list.filter(c => c.status === tab && c.type === 'general')
  const counts = {
    pending: list.filter(c => c.status === 'pending' && c.type === 'general').length,
    approved: list.filter(c => c.status === 'approved' && c.type === 'general').length,
    rejected: list.filter(c => c.status === 'rejected' && c.type === 'general').length,
  }

  const handleApprove = async (id: string, createdBy: string) => {
    setActing(id)
    await supabase.from('communities').update({ status: 'approved', is_active: true }).eq('id', id)
    if (createdBy) {
      await supabase.from('notifications').insert({
        profile_id: createdBy,
        type: 'community_approved',
        title: 'Community approved!',
        body: 'Your community request has been approved.',
        is_read: false,
        related_id: id,
      })
    }
    setList(prev => prev.map(c => c.id === id ? { ...c, status: 'approved', is_active: true } : c))
    setActing(null)
  }

  const handleReject = async (id: string, createdBy: string) => {
    setActing(id)
    await supabase.from('communities').update({ status: 'rejected', is_active: false }).eq('id', id)
    if (createdBy) {
      await supabase.from('notifications').insert({
        profile_id: createdBy,
        type: 'community_rejected',
        title: 'Community request rejected',
        body: 'Your community request was not approved.',
        is_read: false,
        related_id: id,
      })
    }
    setList(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
    setActing(null)
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Community Approvals</h1>
          <p className="page-subtitle">Review and approve community creation requests</p>
        </div>

        <div className="tabs">
          {(['pending', 'approved', 'rejected'] as const).map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◉</div>
            <div className="empty-title">No {tab} communities</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(c => (
              <div key={c.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700' }}>{c.name}</span>
                      {c.category && <span className="badge badge-blue" style={{ fontSize: '10px' }}>{c.category}</span>}
                    </div>
                    {c.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px', maxWidth: '500px' }}>{c.description}</p>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      Requested by <strong style={{ color: 'var(--text-2)' }}>{c.creator?.full_name}</strong>
                      {c.creator?.email && ` (${c.creator.email})`}
                      · {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  {tab === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button className="btn btn-success btn-sm" disabled={acting === c.id} onClick={() => handleApprove(c.id, c.created_by)}>
                        {acting === c.id ? '...' : '✓ Approve'}
                      </button>
                      <button className="btn btn-danger btn-sm" disabled={acting === c.id} onClick={() => handleReject(c.id, c.created_by)}>
                        {acting === c.id ? '...' : '✗ Reject'}
                      </button>
                    </div>
                  ) : (
                    <span className={`badge badge-${tab === 'approved' ? 'green' : 'red'}`}>{tab}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}