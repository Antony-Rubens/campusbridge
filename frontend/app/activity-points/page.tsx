'use client'

import { useEffect, useState } from 'react'
import { supabase, KTU_CATEGORIES } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const KTU_REQUIRED = 100

export default function Page() {
  const [profile, setProfile] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
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
        .select('*, certificates(title, activity_level, reviewed_at)')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
      setRecords(recs || [])

      const { data: ktuRules } = await supabase
        .from('ktu_rules')
        .select('*')
        .eq('scheme', prof?.scheme || '2019')
      setRules(ktuRules || [])

      setLoading(false)
    }
    load()
  }, [])

  const total = records.reduce((s, r) => s + r.awarded_points, 0)
  // Progress bar shows progress toward KTU requirement (100 pts)
  // But total can exceed 100 — no display cap
  const progressPct = Math.min((total / KTU_REQUIRED) * 100, 100)
  const requirementMet = total >= KTU_REQUIRED

  const categoryTotal = (cat: string) =>
    records.filter(r => r.category === cat).reduce((s, r) => s + r.awarded_points, 0)

  const categoryMax = (cat: string) =>
    rules.find(r => r.category === cat)?.max_points_per_category || 30

  const categoryAttempts = (cat: string) =>
    records.filter(r => r.category === cat).length

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
          <p className="page-subtitle">KTU {profile?.scheme || '2019'} Scheme · {profile?.departments?.name}</p>
        </div>

        {/* Total */}
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
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: requirementMet ? 'var(--green)' : 'var(--text-2)' }}>
                {requirementMet ? '✓ Done' : `${KTU_REQUIRED - total} left`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {requirementMet ? 'KTU requirement met' : `to reach ${KTU_REQUIRED} required`}
              </div>
            </div>
          </div>
          <div className="progress-track" style={{ height: '10px' }}>
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          {total > KTU_REQUIRED && (
            <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '6px' }}>
              +{total - KTU_REQUIRED} points above requirement
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Breakdown by Category
        </h3>
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          {KTU_CATEGORIES.map(cat => {
            const earned = categoryTotal(cat)
            const max = categoryMax(cat)
            const attempts = categoryAttempts(cat)
            const pct = Math.min((earned / max) * 100, 100)
            const capped = earned >= max
            return (
              <div key={cat} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{cat}</div>
                  <span className="badge badge-gray" style={{ fontSize: '10px' }}>{attempts} cert{attempts !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: capped ? 'var(--green)' : 'var(--accent)' }}>
                    {earned}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>/ {max} max per category</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: capped ? 'var(--green)' : undefined }} />
                </div>
                {capped && <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '6px' }}>✓ Category maxed</div>}
              </div>
            )
          })}
        </div>

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
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{r.certificates?.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    {r.category} · {r.certificates?.activity_level} level
                    {r.attempt_number > 1 && (
                      <span style={{ color: 'var(--yellow)', marginLeft: '6px' }}>
                        (attempt #{r.attempt_number} — diminishing returns)
                      </span>
                    )}
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