'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_BADGE: Record<string,string> = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red' }

export default function CertificatesPage() {
  const router = useRouter()
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('all')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const { data } = await supabase.from('certificates').select('*').eq('profile_id', session.user.id).order('created_at', { ascending:false })
      setCerts(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = filter === 'all' ? certs : certs.filter(c => c.status === filter)

  return (
    <div className="page">
      <div className="fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Certificates</h1>
          <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>{certs.length} certificates submitted</p>
        </div>
        <Link href="/certificates/upload" className="btn btn-primary">+ Upload Certificate</Link>
      </div>

      <div className="fade-up-1" style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
        {(['all','pending','approved','rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform:'capitalize' }}>
            {f} {f !== 'all' && <span style={{ opacity:.7 }}>({certs.filter(c => c.status === f).length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {[...Array(3)].map((_,i) => <div key={i} className="card" style={{ height:'80px', opacity:.4 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📜</div>
          <p style={{ marginBottom:'12px' }}>No certificates {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          {filter === 'all' && <Link href="/certificates/upload" className="btn btn-primary btn-sm">Upload your first certificate</Link>}
        </div>
      ) : (
        <div className="fade-up-2" style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {filtered.map(cert => (
            <div key={cert.id} className="card card-hover" style={{ padding:'18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'16px' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', flexWrap:'wrap' }}>
                  <span className={`badge ${STATUS_BADGE[cert.status] ?? 'badge-gray'}`}>{cert.status}</span>
                  {cert.activity_category && <span className="badge badge-gray">{cert.activity_category}</span>}
                  {cert.activity_level && <span className="badge badge-gray">{cert.activity_level}</span>}
                </div>
                <p style={{ fontWeight:600, color:'var(--text)', fontSize:'14px', margin:'0 0 4px' }}>{cert.title}</p>
                {cert.description && <p style={{ color:'var(--text2)', fontSize:'12px', margin:'0 0 6px' }}>{cert.description}</p>}
                {cert.faculty_remarks && (
                  <p style={{ color: cert.status === 'rejected' ? 'var(--red)' : 'var(--green)', fontSize:'12px', margin:0, fontStyle:'italic' }}>
                    Faculty note: "{cert.faculty_remarks}"
                  </p>
                )}
                <p style={{ color:'var(--text3)', fontSize:'11px', margin:'6px 0 0' }}>
                  Submitted {new Date(cert.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                {cert.status === 'approved' && (
                  <p style={{ fontWeight:800, color:'var(--amber)', fontSize:'20px', margin:'0 0 2px', lineHeight:1 }}>+{cert.awarded_points}</p>
                )}
                {cert.status === 'pending' && cert.suggested_points > 0 && (
                  <p style={{ color:'var(--text3)', fontSize:'12px', margin:'0 0 2px' }}>{cert.suggested_points} pts suggested</p>
                )}
                {cert.file_url && (
                  <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs">View file</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}