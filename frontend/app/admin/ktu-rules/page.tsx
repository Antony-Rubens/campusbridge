'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const GROUPS = [1, 2, 3]
const GROUP_LABELS: Record<number, string> = {
  1: 'Group I — Sports, Arts & Cultural',
  2: 'Group II — Technical, Competitions & Academic',
  3: 'Group III — Industry, Innovation & Research',
}
const SEGMENTS = [
  '1-national', '2-sports', '3-cultural',
  '4-professional', '5-entrepreneurship', '6-leadership'
]
const SEGMENT_LABELS: Record<string, string> = {
  '1-national': 'National Initiatives',
  '2-sports': 'Sports & Games',
  '3-cultural': 'Cultural Activities',
  '4-professional': 'Professional Self Initiatives',
  '5-entrepreneurship': 'Entrepreneurship & Innovation',
  '6-leadership': 'Leadership & Management',
}

export default function AdminKtuRulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [scheme, setScheme] = useState<'2024' | '2019'>('2024')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('ktu_rules').select('*').order('scheme').order('sub_activity_code')
      .then(({ data }) => { setRules(data || []); setLoading(false) })
  }, [])

  const filtered = rules.filter(r => r.scheme === scheme)

  const byGroup = (g: number) => filtered.filter(r => r.group_number === g)
  const bySegment = (s: string) => filtered.filter(r => r.segment === s)

  const handleUpdate = async (ruleId: string, field: string, value: string) => {
    const parsed = parseFloat(value)
    if (isNaN(parsed)) return
    await supabase.from('ktu_rules').update({ [field]: parsed }).eq('id', ruleId)
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: parsed } : r))
  }

  const numInput = (rule: any, field: string) => (
    <input
      type="number"
      defaultValue={rule[field]}
      min="0"
      onBlur={e => {
        if (e.target.value !== String(rule[field])) handleUpdate(rule.id, field, e.target.value)
      }}
      style={{
        width: '52px', background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '4px', padding: '3px 5px', color: 'var(--text)',
        fontSize: '12px', textAlign: 'center', fontFamily: 'Sora, sans-serif',
      }}
    />
  )

  const RuleRow = ({ rule }: { rule: any }) => (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-3)', fontWeight: '600' }}>
        {rule.sub_activity_code}
      </td>
      <td style={{ padding: '10px 12px', fontSize: '12px' }}>
        {rule.sub_activity_name}
        {rule.notes && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{rule.notes}</div>}
      </td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_l1')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_l2')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_l3')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_l4')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_l5')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_fixed')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_tier_1')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_tier_2')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{numInput(rule, 'points_tier_3')}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)' }}>{rule.max_points}</span>
      </td>
    </tr>
  )

  const TableHeader = () => (
    <thead>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        {['Code', 'Sub-activity', 'L1', 'L2', 'L3', 'L4', 'L5', 'Fixed', 'T1', 'T2', 'T3', 'Max'].map(h => (
          <th key={h} style={{ padding: '8px 8px', color: 'var(--text-3)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h === 'Sub-activity' || h === 'Code' ? 'left' : 'center', whiteSpace: 'nowrap' }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">KTU Activity Point Rules</h1>
          <p className="page-subtitle">View and edit point values per scheme</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['2024', '2019'] as const).map(s => (
            <button key={s} className={`btn ${scheme === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setScheme(s)}>
              KTU {s} Scheme
            </button>
          ))}
        </div>

        <div className="card" style={{ marginBottom: '16px', background: 'var(--yellow-glow)', borderColor: '#f5c54220' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            ⚠️ Changes here affect all future point calculations. Click out of a field to auto-save.
            Existing approved records are not retroactively changed.
            L1=College, L2=Zonal, L3=State, L4=National, L5=International.
            T1/T2/T3 = Tier points for score-based activities.
          </p>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {scheme === '2024' && GROUPS.map(g => {
              const groupRules = byGroup(g)
              if (!groupRules.length) return null
              return (
                <div key={g} style={{ marginBottom: '28px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--text)' }}>
                    {GROUP_LABELS[g]}
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <TableHeader />
                      <tbody>
                        {groupRules.map(rule => <RuleRow key={rule.id} rule={rule} />)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            {scheme === '2019' && SEGMENTS.map(seg => {
              const segRules = bySegment(seg)
              if (!segRules.length) return null
              return (
                <div key={seg} style={{ marginBottom: '28px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--text)' }}>
                    {SEGMENT_LABELS[seg]}
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <TableHeader />
                      <tbody>
                        {segRules.map(rule => <RuleRow key={rule.id} rule={rule} />)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </main>
    </div>
  )
}