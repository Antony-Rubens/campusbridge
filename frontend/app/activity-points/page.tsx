'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const SCHEME_2024_REQUIRED_TOTAL = 120
const SCHEME_2024_REQUIRED_PER_GROUP = 40
const SCHEME_2019_REQUIRED = 100

const GROUP_LABELS: Record<number, string> = {
  1: 'Group I — Sports, Arts & Cultural',
  2: 'Group II — Technical, Competitions & Academic',
  3: 'Group III — Industry, Innovation & Research',
}

const SEGMENT_LABELS: Record<string, string> = {
  '1-national':        'National Initiatives',
  '2-sports':          'Sports & Games',
  '3-cultural':        'Cultural Activities',
  '4-professional':    'Professional Self Initiatives',
  '5-entrepreneurship':'Entrepreneurship & Innovation',
  '6-leadership':      'Leadership & Management',
}

export default function Page() {
  const [profile, setProfile] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, scheme, semester, departments(name)')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      const { data: recs } = await supabase
        .from('activity_point_records')
        .select('*, certificates(title, reviewed_at)')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
      setRecords(recs || [])

      setLoading(false)
    }
    load()
  }, [])

  const scheme = profile?.scheme ?? '2024'
  const is2024 = scheme === '2024'

  const groupPoints = {
    1: records.filter(r => r.group_number === 1).reduce((s, r) => s + r.awarded_points, 0),
    2: records.filter(r => r.group_number === 2).reduce((s, r) => s + r.awarded_points, 0),
    3: records.filter(r => r.group_number === 3).reduce((s, r) => s + r.awarded_points, 0),
  }
  const total2024 = groupPoints[1] + groupPoints[2] + groupPoints[3]
  const creditsEarned = [1, 2, 3].filter(g => groupPoints[g as 1|2|3] >= SCHEME_2024_REQUIRED_PER_GROUP).length
  const eligible2024 = creditsEarned === 3

  const total2019 = records.reduce((s, r) => s + r.awarded_points, 0)
  const eligible2019 = total2019 >= SCHEME_2019_REQUIRED

  const total = is2024 ? total2024 : total2019
  const required = is2024 ? SCHEME_2024_REQUIRED_TOTAL : SCHEME_2019_REQUIRED
  const eligible = is2024 ? eligible2024 : eligible2019

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
        <div className="page-header">
          <h1 className="page-title">Activity Points</h1>
          <p className="page-subtitle">KTU {scheme} Scheme · {profile?.departments?.name}</p>
        </div>

        {/* Overall summary */}
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
                total activity points earned
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: eligible ? 'var(--green)' : 'var(--text-2)' }}>
                {is2024 ? `${creditsEarned}/3 Credits` : eligible ? '✓ Done' : `${required - total} left`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {eligible
                  ? is2024 ? 'All 3 activity credits earned' : 'KTU requirement met (2 credits)'
                  : `of ${required} required`}
              </div>
            </div>
          </div>
          <div className="progress-track" style={{ height: '10px' }}>
            <div className="progress-fill" style={{ width: `${Math.min((total / required) * 100, 100)}%` }} />
          </div>
        </div>

        {/* 2024: Group breakdown */}
        {is2024 && (
          <>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Points by Group (min 40 each)
            </h3>
            <div className="grid-3" style={{ marginBottom: '28px' }}>
              {([1, 2, 3] as const).map(g => {
                const earned = groupPoints[g]
                const pct = Math.min((earned / SCHEME_2024_REQUIRED_PER_GROUP) * 100, 100)
                const done = earned >= SCHEME_2024_REQUIRED_PER_GROUP
                return (
                  <div key={g} className="card">
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Group {g}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '700', color: done ? 'var(--green)' : 'var(--accent)' }}>
                        {earned}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>/ 40 min</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: done ? 'var(--green)' : undefined }} />
                    </div>
                    <div style={{ fontSize: '11px', color: done ? 'var(--green)' : 'var(--text-3)', marginTop: '6px' }}>
                      {done ? '✓ Credit earned' : `${SCHEME_2024_REQUIRED_PER_GROUP - earned} more needed`}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
                      {GROUP_LABELS[g]}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* 2019: Segment breakdown */}
        {!is2024 && (
          <>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Breakdown by Segment
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {Object.entries(SEGMENT_LABELS).map(([seg, label]) => {
                const earned = segmentTotal(seg)
                return (
                  <div key={seg} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                    <span style={{ fontSize: '13px' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: earned > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                      {earned} pts
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* History */}
        <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Approved Point History
        </h3>
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">No approved points yet</div>
            <div className="empty-desc">Upload certificates and get them approved by your faculty coordinator</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {records.map(r => (
              <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--green-glow)', color: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '700', flexShrink: 0,
                }}>+{r.awarded_points}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                    {r.certificates?.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    {r.sub_activity_code && <span>{r.sub_activity_code} · </span>}
                    {r.event_level && <span>{r.event_level} level · </span>}
                    {is2024
                      ? r.group_number ? `Group ${r.group_number}` : ''
                      : r.segment ? SEGMENT_LABELS[r.segment] ?? r.segment : ''}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>
                  {r.certificates?.reviewed_at
                    ? new Date(r.certificates.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}