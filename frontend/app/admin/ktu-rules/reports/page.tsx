'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminKtuRulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeScheme, setActiveScheme] = useState('2024')

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true)
      setError('')
      
      const { data, error: fetchError } = await supabase
        .from('ktu_rules')
        .select('*')
        .eq('scheme', activeScheme)
        .order('sub_activity_code', { ascending: true })

      if (fetchError) {
        setError(`Failed to load rules: ${fetchError.message}`)
        console.error('Fetch error:', fetchError)
      } else {
        setRules(data || [])
      }
      setLoading(false)
    }

    fetchRules()
  }, [activeScheme])

  if (loading && rules.length === 0) {
    return (
      <div className="page-wrapper">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">KTU Activity Rules</h1>
          <p className="page-subtitle">Manage points and constraints for activity categories</p>
        </div>

        {/* Scheme Toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button 
            className={`btn ${activeScheme === '2024' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveScheme('2024')}
          >
            2024 Scheme
          </button>
          <button 
            className={`btn ${activeScheme === '2019' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveScheme('2019')}
          >
            2019 Scheme
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Activity Name</th>
                <th>{activeScheme === '2024' ? 'Group' : 'Segment'}</th>
                <th>Max Pts</th>
                <th>L1 (College)</th>
                <th>L2 (Zonal)</th>
                <th>L3 (State)</th>
                <th>L4 (Nat)</th>
                <th>L5 (Intl)</th>
                <th>Fixed</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>
                    No rules found for the {activeScheme} scheme.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{rule.sub_activity_code}</td>
                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rule.sub_activity_name}>
                      {rule.sub_activity_name}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>
                        {activeScheme === '2024' ? `Grp ${rule.group_number}` : rule.segment}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{rule.max_points}</td>
                    <td>{rule.points_l1 || '-'}</td>
                    <td>{rule.points_l2 || '-'}</td>
                    <td>{rule.points_l3 || '-'}</td>
                    <td>{rule.points_l4 || '-'}</td>
                    <td>{rule.points_l5 || '-'}</td>
                    <td>{rule.points_fixed || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}