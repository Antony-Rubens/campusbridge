'use client'

import { useEffect, useState } from 'react'
import { supabase, KTU_CATEGORIES, ACTIVITY_LEVELS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminKtuRulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [scheme, setScheme] = useState<'2019' | '2025'>('2025')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('ktu_rules').select('*').order('scheme').order('category').order('level')
      .then(({ data }) => { setRules(data || []); setLoading(false) })
  }, [])

  const filtered = rules.filter(r => r.scheme === scheme)

  const getRule = (cat: string, level: string) =>
    filtered.find(r => r.category === cat && r.level === level)

  const handleUpdate = async (ruleId: string, field: string, value: string) => {
    setSaving(ruleId)
    await supabase.from('ktu_rules').update({ [field]: parseFloat(value), updated_at: new Date().toISOString() }).eq('id', ruleId)
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: parseFloat(value) } : r))
    setSaving(null)
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">KTU Activity Point Rules</h1>
          <p className="page-subtitle">Configure point values per scheme, category and level</p>
        </div>

        {/* Scheme toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['2025', '2019'] as const).map(s => (
            <button
              key={s}
              className={`btn ${scheme === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setScheme(s)}
            >
              KTU {s} Scheme
            </button>
          ))}
        </div>

        <div className="card" style={{ marginBottom: '16px', background: 'var(--yellow-glow)', borderColor: '#f5c54220' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            ⚠️ Changes here affect all future point calculations. Existing approved records are not changed.
            Base points apply to 1st attempt. 2nd attempt = base × multiplier_2. 3rd+ = base × multiplier_3.
          </p>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-3)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                  {ACTIVITY_LEVELS.map(l => (
                    <th key={l} colSpan={4} style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-3)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', borderLeft: '1px solid var(--border)' }}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </th>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '6px 12px' }} />
                  {ACTIVITY_LEVELS.map(l => (
                    ['Base', 'Max/Cat', '×2', '×3'].map(col => (
                      <th key={`${l}-${col}`} style={{ padding: '6px 8px', color: 'var(--text-3)', fontSize: '10px', textAlign: 'center', borderLeft: col === 'Base' ? '1px solid var(--border)' : undefined }}>
                        {col}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {KTU_CATEGORIES.map(cat => (
                  <tr key={cat} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>{cat}</td>
                    {ACTIVITY_LEVELS.map(level => {
                      const rule = getRule(cat, level)
                      if (!rule) return (
                        ['base_points', 'max_points_per_category', 'attempt_2_multiplier', 'attempt_3_multiplier'].map(f => (
                          <td key={f} style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text-3)', borderLeft: f === 'base_points' ? '1px solid var(--border)' : undefined }}>—</td>
                        ))
                      )
                      return (
                        ['base_points', 'max_points_per_category', 'attempt_2_multiplier', 'attempt_3_multiplier'].map(field => (
                          <td key={field} style={{ padding: '4px 6px', borderLeft: field === 'base_points' ? '1px solid var(--border)' : undefined }}>
                            <input
                              type="number"
                              defaultValue={rule[field]}
                              step={field.includes('multiplier') ? '0.05' : '1'}
                              min="0"
                              onBlur={e => {
                                if (e.target.value !== String(rule[field])) {
                                  handleUpdate(rule.id, field, e.target.value)
                                }
                              }}
                              style={{
                                width: '60px', background: 'var(--bg-3)', border: '1px solid var(--border)',
                                borderRadius: '4px', padding: '4px 6px', color: 'var(--text)',
                                fontSize: '12px', textAlign: 'center', fontFamily: 'Sora, sans-serif',
                                outline: 'none',
                              }}
                            />
                          </td>
                        ))
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '12px' }}>
          Click out of a field to auto-save changes. Multiplier values: 0.5 = 50% of base, 0.25 = 25% of base.
        </p>
      </main>
    </div>
  )
}