'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, KTU_TARGET_POINTS_2019, KTU_TARGET_POINTS_2024, KTU_TARGET_PER_GROUP_2024, GROUP_LABELS, SEGMENT_LABELS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function StudentDetailPage() {
  const { studentid } = useParams()
  const [student, setStudent] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*, departments(name), batches!profiles_batch_id_fkey(name)')
        .eq('id', studentid)
        .single()
      setStudent(prof)

      const { data: recs } = await supabase
        .from('activity_point_records')
        .select('*, certificates(title, reviewed_at)')
        .eq('profile_id', studentid)
        .order('created_at', { ascending: false })
      setRecords(recs || [])

      const { data: certList } = await supabase
        .from('certificates')
        .select('*')
        .eq('profile_id', studentid)
        .order('created_at', { ascending: false })
      setCerts(certList || [])

      setLoading(false)
    }
    load()
  }, [studentid])

  const scheme = student?.scheme ?? '2024'
  const is2024 = scheme === '2024'

  const total = records.reduce((s, r) => s + r.awarded_points, 0)

  // 2024 group totals
  const groupPoints = {
    1: records.filter(r => r.group_number === 1).reduce((s, r) => s + r.awarded_points, 0),
    2: records.filter(r => r.group_number === 2).reduce((s, r) => s + r.awarded_points, 0),
    3: records.filter(r => r.group_number === 3).reduce((s, r) => s + r.awarded_points, 0),
  }
  const eligible2024 = [1, 2, 3].every(g => groupPoints[g as 1|2|3] >= KTU_TARGET_PER_GROUP_2024)
  const eligible2019 = total >= KTU_TARGET_POINTS_2019
  const eligible = is2024 ? eligible2024 : eligible2019

  const required = is2024 ? KTU_TARGET_POINTS_2024 : KTU_TARGET_POINTS_2019
  const pct = Math.min((total / required) * 100, 100)

  // 2019 segment totals
  const segmentTotal = (seg: string) =>
    records.filter(r => r.segment === seg).reduce((s, r) => s + r.awarded_points, 0)

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
            <h1 className="page-title">{student?.full_name}</h1>
            <p className="page-subtitle">
              {student?.roll_number} · {student?.departments?.name} · S{student?.semester} · KTU {scheme} Scheme
            </p>
          </div>
          <Link href="/faculty/students" className="btn btn-ghost">← All Students</Link>
        </div>

        {/* Points summary */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>of {required} required</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: eligible ? 'var(--green)' : 'var(--text-2)' }}>
                {is2024 ? `${[1,2,3].filter(g => groupPoints[g as 1|2|3] >= KTU_TARGET_PER_GROUP_2024).length}/3 Credits` : `${pct.toFixed(0)}%`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {eligible ? '✓ Requirement met' : is2024 ? 'Groups incomplete' : `${required - total} more needed`}
              </div>
            </div>
          </div>
          <div className="progress-track" style={{ height: '8px' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Breakdown */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              {is2024 ? 'By Group' : 'By Segment'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {is2024 ? (
                ([1, 2, 3] as const).map(g => {
                  const earned = groupPoints[g]
                  const done = earned >= KTU_TARGET_PER_GROUP_2024
                  return (
                    <div key={g} className="card" style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>Group {g}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: done ? 'var(--green)' : 'var(--text-3)' }}>
                          {earned} / 40
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.min((earned / 40) * 100, 100)}%`, background: done ? 'var(--green)' : undefined }} />
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>{GROUP_LABELS[g]}</div>
                    </div>
                  )
                })
              ) : (
                Object.entries(SEGMENT_LABELS).map(([seg, label]) => {
                  const earned = segmentTotal(seg)
                  return (
                    <div key={seg} className="card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px' }}>{label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: earned > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                        {earned} pts
                      </span>
                    </div>
                  )
                })
              )}
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
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
                        {cert.sub_activity_code && <span>{cert.sub_activity_code} · </span>}
                        {cert.event_level && <span>{cert.event_level} · </span>}
                        {cert.achievement_type && <span>{cert.achievement_type.replace(/_/g, ' ')}</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {cert.group_number && (
                          <span className="badge badge-purple" style={{ fontSize: '10px' }}>Group {cert.group_number}</span>
                        )}
                        {cert.segment && (
                          <span className="badge badge-purple" style={{ fontSize: '10px' }}>{SEGMENT_LABELS[cert.segment] ?? cert.segment}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                      {cert.status === 'approved' && (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--green)' }}>+{cert.awarded_points}</span>
                      )}
                      <span className={`badge badge-${cert.status === 'approved' ? 'green' : cert.status === 'rejected' ? 'red' : 'yellow'}`} style={{ fontSize: '10px' }}>
                        {cert.status}
                      </span>
                    </div>
                  </div>
                  {cert.faculty_remarks && (
                    <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '6px' }}>
                      "{cert.faculty_remarks}"
                    </div>
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