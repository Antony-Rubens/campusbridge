'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, SEGMENT_LABELS, GROUP_LABELS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function CertificatesPage() {
  const [profile, setProfile] = useState<any>(null)
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, scheme, faculty_coordinator_id')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      const { data: certList } = await supabase
        .from('certificates')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
      setCerts(certList || [])

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

  const scheme = profile?.scheme ?? '2024'
  const is2024 = scheme === '2024'

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
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">My Certificates</h1>
            <p className="page-subtitle">KTU {scheme} Scheme</p>
          </div>
          <Link href="/certificates/upload" className="btn btn-primary">+ Upload New</Link>
        </div>

        {!profile?.faculty_coordinator_id && (
          <div style={{
            background: 'var(--yellow-glow)', border: '1px solid #f5c54220',
            borderRadius: 'var(--radius)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '20px', fontSize: '13px',
          }}>
            <span>⚠️</span>
            <span style={{ color: 'var(--text-2)' }}>
              No faculty coordinator assigned — your certificates cannot be reviewed.{' '}
              <Link href="/profile" style={{ color: 'var(--yellow)', fontWeight: '600' }}>Fix in profile →</Link>
            </span>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">
              {filter === 'all' ? 'No certificates yet' : `No ${filter} certificates`}
            </div>
            <div className="empty-desc">
              {filter === 'all' ? 'Upload your activity certificates to earn KTU activity points' : `You have no ${filter} certificates`}
            </div>
            {filter === 'all' && (
              <Link href="/certificates/upload" className="btn btn-primary" style={{ marginTop: '16px' }}>
                + Upload Certificate
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(cert => (
              <div key={cert.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>{cert.title}</div>

                    {/* Activity details */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                      {cert.sub_activity_code && (
                        <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                          {cert.sub_activity_code} — {cert.sub_activity_name}
                        </span>
                      )}
                      {cert.event_level && (
                        <span className="badge badge-gray" style={{ fontSize: '10px' }}>{cert.event_level}</span>
                      )}
                      {cert.achievement_type && (
                        <span className="badge badge-gray" style={{ fontSize: '10px' }}>
                          {cert.achievement_type.replace(/_/g, ' ')}
                        </span>
                      )}
                      {is2024 && cert.group_number && (
                        <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                          {GROUP_LABELS[cert.group_number as 1|2|3] ?? `Group ${cert.group_number}`}
                        </span>
                      )}
                      {!is2024 && cert.segment && (
                        <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                          {SEGMENT_LABELS[cert.segment] ?? cert.segment}
                        </span>
                      )}
                    </div>

                    {/* Dates and remarks */}
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      Submitted {new Date(cert.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {cert.reviewed_at && ` · Reviewed ${new Date(cert.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </div>
                    {cert.faculty_remarks && (
                      <div style={{ fontSize: '12px', color: cert.status === 'rejected' ? 'var(--red)' : 'var(--text-3)', marginTop: '6px', fontStyle: 'italic' }}>
                        "{cert.faculty_remarks}"
                      </div>
                    )}
                  </div>

                  {/* Status & points */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge badge-${cert.status === 'approved' ? 'green' : cert.status === 'rejected' ? 'red' : 'yellow'}`} style={{ fontSize: '11px', marginBottom: '6px', display: 'block' }}>
                      {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                    </span>
                    {cert.status === 'approved' && cert.awarded_points != null && (
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--green)', lineHeight: 1 }}>
                        +{cert.awarded_points}
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '400' }}>pts awarded</div>
                      </div>
                    )}
                    {cert.status === 'pending' && (
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--yellow)', lineHeight: 1 }}>
                        ~{cert.suggested_points}
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '400' }}>suggested</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}