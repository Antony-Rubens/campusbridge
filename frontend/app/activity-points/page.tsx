'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ActivityPoints() {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const uid = session.user.id
      const [sumRes, recRes] = await Promise.all([
        supabase.from('activity_point_summary').select('*').eq('profile_id', uid).single(),
        supabase.from('activity_point_records').select('*, certificate:certificates(title,activity_category,activity_level)').eq('profile_id', uid).order('created_at', { ascending:false }),
      ])
      setSummary(sumRes.data)
      setRecords(recRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="page-loading"><div className="spinner"/></div>

  const pts = summary?.total_points ?? 0
  const max = summary?.max_allowed ?? 100
  const pct = Math.min((pts / max) * 100, 100)

  const byCategory: Record<string, number> = {}
  records.forEach(r => { byCategory[r.category] = (byCategory[r.category] ?? 0) + r.awarded_points })

  return (
    <div className="page">
      <div className="fade-up" style={{ marginBottom:'28px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Activity Points</h1>
        <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>Your KTU activity point record</p>
      </div>

      <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
        <div className="card" style={{ padding:'24px' }}>
          <p style={{ color:'var(--text2)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 10px' }}>Total Points</p>
          <p style={{ fontSize:'52px', fontWeight:800, color:'var(--amber)', margin:'0 0 10px', lineHeight:1 }}>{pts}</p>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text3)', marginBottom:'8px' }}>
            <span>Progress to maximum</span><span>{pts}/{max}</span>
          </div>
          <div style={{ height:'6px', background:'var(--border)', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background:'var(--amber)', borderRadius:'3px', transition:'width .6s ease' }} />
          </div>
          {pts >= max && <p style={{ color:'var(--amber)', fontSize:'12px', margin:'8px 0 0', fontWeight:600 }}>🎉 Maximum points achieved!</p>}
        </div>

        <div className="card" style={{ padding:'24px' }}>
          <p style={{ color:'var(--text2)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 14px' }}>By Category</p>
          {Object.keys(byCategory).length === 0 ? (
            <p style={{ color:'var(--text3)', fontSize:'13px', margin:0 }}>No approved certificates yet</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {Object.entries(byCategory).map(([cat, catPts]) => (
                <div key={cat} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'13px', color:'var(--text2)' }}>{cat}</span>
                  <span className="badge badge-amber">{catPts} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fade-up-2">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <h2 className="section-title">Point History</h2>
          <Link href="/certificates/upload" className="btn btn-primary btn-sm">+ Upload Certificate</Link>
        </div>
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏅</div>
            <p style={{ marginBottom:'12px' }}>No activity points yet</p>
            <Link href="/certificates/upload" className="btn btn-primary btn-sm">Upload a certificate to get started</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {records.map(r => (
              <div key={r.id} className="card" style={{ padding:'16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'16px' }}>
                <div>
                  <p style={{ fontWeight:600, color:'var(--text)', fontSize:'14px', margin:'0 0 4px' }}>{r.certificate?.title || r.category}</p>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {r.category && <span className="badge badge-gray">{r.category}</span>}
                    {r.level && <span className="badge badge-gray">{r.level}</span>}
                    {r.attempt_number > 1 && <span className="badge badge-gray">Attempt #{r.attempt_number}</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:'22px', fontWeight:800, color:'var(--amber)', margin:'0 0 2px', lineHeight:1 }}>+{r.awarded_points}</p>
                  {r.base_points !== r.awarded_points && (
                    <p style={{ fontSize:'11px', color:'var(--text3)', margin:0 }}>Base: {r.base_points}</p>
                  )}
                  <p style={{ fontSize:'11px', color:'var(--text3)', margin:'2px 0 0' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}