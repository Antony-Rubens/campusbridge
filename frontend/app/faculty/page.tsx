'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function FacultyPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState<Record<string,string>>({})
  const [points, setPoints] = useState<Record<string,string>>({})
  const [processing, setProcessing] = useState<string|null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (!['faculty','system_admin'].includes(profile?.role)) { router.push('/dashboard'); return }

      const { data } = await supabase.from('certificates')
        .select('*, profile:profiles(full_name,department,semester,admission_no)')
        .eq('status', 'pending')
        .order('created_at')
      setCerts(data ?? [])
      const initPts: Record<string,string> = {}
      data?.forEach((c: any) => { initPts[c.id] = String(c.suggested_points ?? 0) })
      setPoints(initPts)
      setLoading(false)
    }
    load()
  }, [router])

  const handleReview = async (certId: string, status: 'approved'|'rejected') => {
    setProcessing(certId); setError('')
    const awarded = parseInt(points[certId] ?? '0') || 0
    const { error: err } = await supabase.from('certificates').update({
      status, awarded_points: awarded,
      faculty_remarks: remarks[certId] || null,
      reviewed_by: userId, reviewed_at: new Date().toISOString(),
    }).eq('id', certId)
    if (err) { setError(err.message); setProcessing(null); return }
    if (status === 'approved' && certs.find(c => c.id === certId)?.file_url) {
      const fileUrl = certs.find(c => c.id === certId)?.file_url ?? ''
      const path = fileUrl.split('/certificates/')[1]
      if (path) await supabase.storage.from('certificates').remove([path])
    }
    setCerts(p => p.filter(c => c.id !== certId))
    setProcessing(null)
  }

  if (loading) return <div className="page-loading"><div className="spinner"/></div>

  return (
    <div className="page">
      <div className="fade-up" style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Faculty Review Panel</h1>
        <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>{certs.length} certificates pending review</p>
      </div>
      {error && <div className="error-box fade-up" style={{ marginBottom:'16px' }}>{error}</div>}
      {certs.length === 0 ? (
        <div className="empty-state fade-up"><div className="icon">✅</div><p>All certificates reviewed — nothing pending</p></div>
      ) : (
        <div className="fade-up-1" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {certs.map(cert => (
            <div key={cert.id} className="card" style={{ padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px', gap:'12px', flexWrap:'wrap' }}>
                <div>
                  <div style={{ display:'flex', gap:'6px', marginBottom:'6px', flexWrap:'wrap' }}>
                    <span className="badge badge-gray">{cert.activity_category}</span>
                    <span className="badge badge-gray">{cert.activity_level}</span>
                    <span className="badge badge-gray">{cert.activity_role}</span>
                  </div>
                  <p style={{ fontWeight:700, color:'var(--text)', fontSize:'15px', margin:'0 0 4px' }}>{cert.title}</p>
                  <p style={{ color:'var(--text2)', fontSize:'13px', margin:'0 0 2px' }}>
                    {cert.profile?.full_name} · {cert.profile?.department} S{cert.profile?.semester}
                    {cert.profile?.admission_no ? ` · ${cert.profile.admission_no}` : ''}
                  </p>
                  {cert.description && <p style={{ color:'var(--text3)', fontSize:'12px', margin:'4px 0 0', fontStyle:'italic' }}>"{cert.description}"</p>}
                  <p style={{ color:'var(--text3)', fontSize:'11px', margin:'6px 0 0' }}>Submitted {new Date(cert.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ color:'var(--text2)', fontSize:'11px', margin:'0 0 2px' }}>Suggested</p>
                  <p style={{ color:'var(--amber)', fontSize:'24px', fontWeight:800, margin:0, lineHeight:1 }}>{cert.suggested_points}</p>
                  {cert.file_url && (
                    <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-xs" style={{ marginTop:'8px', display:'inline-flex' }}>View File</a>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end', paddingTop:'14px', borderTop:'1px solid var(--border)' }}>
                <div>
                  <label className="label">Awarded Points</label>
                  <input type="number" min="0" max="100" className="input"
                    value={points[cert.id] ?? ''} onChange={e => setPoints(p => ({ ...p, [cert.id]: e.target.value }))}
                    style={{ width:'100px' }} />
                </div>
                <div style={{ flex:1, minWidth:'200px' }}>
                  <label className="label">Remarks (optional)</label>
                  <input className="input" placeholder="Note for the student…"
                    value={remarks[cert.id] ?? ''} onChange={e => setRemarks(p => ({ ...p, [cert.id]: e.target.value }))} />
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={() => handleReview(cert.id, 'approved')} disabled={!!processing}
                    className="btn btn-sm" style={{ background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(16,185,129,.2)' }}>
                    {processing === cert.id ? <span className="spinner"/> : '✓ Approve'}
                  </button>
                  <button onClick={() => handleReview(cert.id, 'rejected')} disabled={!!processing} className="btn btn-danger btn-sm">
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}