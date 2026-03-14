'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, KTU_CATEGORIES, KTU_TARGET_POINTS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function StudentDetailPage() {
  const { studentId } = useParams()
  const [student, setStudent] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*, departments(name), batches!profiles_batch_id_fkey(name)')
        .eq('id', studentId)
        .single()
      setStudent(prof)

      const { data: recs } = await supabase
        .from('activity_point_records')
        .select('*, certificates(title, activity_level, reviewed_at)')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
      setRecords(recs || [])

      const { data: certList } = await supabase
        .from('certificates')
        .select('*, profiles!certificates_profile_id_fkey(*)')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
      setCerts(certList || [])

      setLoading(false)
    }
    load()
  }, [studentId])

  const total = records.reduce((s, r) => s + r.awarded_points, 0)
  const pct = Math.min((total / KTU_TARGET_POINTS) * 100, 100)
  const categoryTotal = (cat: string) => records.filter(r => r.category === cat).reduce((s, r) => s + r.awarded_points, 0)

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></main>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">{student?.full_name}</h1>
            <p className="page-subtitle">
              {student?.roll_number} · {student?.departments?.name} · S{student?.semester} · Scheme {student?.scheme || '2019'}
            </p>
          </div>
          <Link href="/faculty/students" className="btn btn-ghost">← All Students</Link>
        </div>

        {/* Points summary */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>of {KTU_TARGET_POINTS} required</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: total >= KTU_TARGET_POINTS ? 'var(--green)' : 'var(--text-2)' }}>
                {pct.toFixed(0)}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {total >= KTU_TARGET_POINTS ? '✓ Requirement met' : `${KTU_TARGET_POINTS - total} more needed`}
              </div>
            </div>
          </div>
          <div className="progress-track" style={{ height: '8px' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Category breakdown */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              By Category
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {KTU_CATEGORIES.map(cat => {
                const earned = categoryTotal(cat)
                return (
                  <div key={cat} className="card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px' }}>{cat}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: earned > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                      {earned} pts
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All certificates */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              All Certificates ({certs.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {certs.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="empty-title">No certificates submitted</div>
                </div>
              ) : certs.map(cert => (
                <div key={cert.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>{cert.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        {cert.activity_category} · {cert.activity_level}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      {cert.status === 'approved' && (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--green)' }}>+{cert.awarded_points}</span>
                      )}
                      <span className={`badge badge-${cert.status === 'approved' ? 'green' : cert.status === 'rejected' ? 'red' : 'yellow'}`} style={{ fontSize: '10px' }}>
                        {cert.status}
                      </span>
                    </div>
                  </div>
                  {cert.faculty_remarks && (
                    <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>"{cert.faculty_remarks}"</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}