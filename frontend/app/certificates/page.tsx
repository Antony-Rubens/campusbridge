'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function CertificatesPage() {
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('certificates')
        .select('*, profiles!certificates_profile_id_fkey(*)')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
      setCerts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? certs : certs.filter(c => c.status === filter)

  const counts = {
    all: certs.length,
    pending: certs.filter(c => c.status === 'pending').length,
    approved: certs.filter(c => c.status === 'approved').length,
    rejected: certs.filter(c => c.status === 'rejected').length,
  }

  const statusBadge = (status: string) => {
    const map: any = {
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
    }
    return map[status] || 'badge-gray'
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">My Certificates</h1>
            <p className="page-subtitle">Track your certificate submissions and approval status</p>
          </div>
          <Link href="/certificates/upload" className="btn btn-primary">+ Upload Certificate</Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <div
              key={s}
              className="stat-card"
              onClick={() => setFilter(s)}
              style={{ cursor: 'pointer', border: filter === s ? '1px solid var(--accent)' : undefined }}
            >
              <div className="stat-value" style={{
                color: s === 'approved' ? 'var(--green)' : s === 'pending' ? 'var(--yellow)' : s === 'rejected' ? 'var(--red)' : 'var(--text)'
              }}>
                {counts[s]}
              </div>
              <div className="stat-label">{s.charAt(0).toUpperCase() + s.slice(1)}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No certificates {filter !== 'all' ? `with status "${filter}"` : 'yet'}</div>
            <div className="empty-desc">Upload a certificate to get your KTU activity points reviewed</div>
            <Link href="/certificates/upload" className="btn btn-primary" style={{ marginTop: '16px' }}>Upload Certificate</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(cert => (
              <div key={cert.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                  background: cert.status === 'approved' ? 'var(--green-glow)' : cert.status === 'rejected' ? 'var(--red-glow)' : 'var(--yellow-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0,
                }}>
                  {cert.status === 'approved' ? '✓' : cert.status === 'rejected' ? '✗' : '⏳'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px', color: 'var(--text)' }}>
                    {cert.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {cert.activity_category} · {cert.activity_level?.charAt(0).toUpperCase() + cert.activity_level?.slice(1)} level
                    · Submitted {new Date(cert.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {cert.status === 'rejected' && cert.faculty_remarks && (
                    <div style={{
                      marginTop: '6px', fontSize: '12px', color: 'var(--red)',
                      background: 'var(--red-glow)', borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px', display: 'inline-block',
                    }}>
                      Remark: {cert.faculty_remarks}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Points</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: cert.status === 'approved' ? 'var(--green)' : 'var(--text-3)' }}>
                      {cert.status === 'approved' ? `+${cert.awarded_points}` : cert.suggested_points}
                      {cert.status === 'pending' && <span style={{ fontSize: '10px', color: 'var(--text-3)' }}> est.</span>}
                    </div>
                  </div>
                  <span className={`badge ${statusBadge(cert.status)}`}>
                    {cert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}