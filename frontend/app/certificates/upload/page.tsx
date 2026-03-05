'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const KTU: Record<string,Record<string,Record<string,number>>> = {
  'NSS/NCC/NSO':{ College:{Participant:30,Leader:50}, University:{Participant:40,Leader:60}, State:{Participant:50,Leader:70}, National:{Participant:60,Leader:80}, International:{Participant:80,Leader:100} },
  'Sports':{ College:{Participant:20,Winner:30}, University:{Participant:30,Winner:50}, State:{Participant:40,Winner:60}, National:{Participant:50,Winner:70}, International:{Participant:60,Winner:80} },
  'Arts':{ College:{Participant:15,Winner:25}, University:{Participant:25,Winner:40}, State:{Participant:35,Winner:50}, National:{Participant:45,Winner:60}, International:{Participant:55,Winner:70} },
  'Professional Body':{ College:{Member:15,'Office Bearer':30}, University:{Member:25,'Office Bearer':40}, State:{Member:35,'Office Bearer':50}, National:{Member:45,'Office Bearer':60}, International:{Member:55,'Office Bearer':70} },
  'Entrepreneurship':{ College:{Participant:20,Winner:40}, University:{Participant:30,Winner:50}, State:{Participant:40,Winner:60}, National:{Participant:50,Winner:70}, International:{Participant:60,Winner:80} },
  'Leadership':{ College:{Member:20,Leader:40}, University:{Member:30,Leader:50}, State:{Member:40,Leader:60}, National:{Member:50,Leader:70}, International:{Member:60,Leader:80} },
  'MOOC':{ College:{Completed:15}, University:{Completed:25}, National:{Completed:35}, International:{Completed:50} },
}

export default function UploadCertificate() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [pts, setPts] = useState(0)
  const [form, setForm] = useState({ title:'', description:'', activity_category:'', activity_level:'', activity_role:'' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)
    })
  }, [router])

  useEffect(() => {
    const { activity_category: cat, activity_level: lv, activity_role: role } = form
    setPts(cat && lv && role ? (KTU[cat]?.[lv]?.[role] ?? 0) : 0)
  }, [form.activity_category, form.activity_level, form.activity_role])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }))

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return }
    setUploading(true); setError('')
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('certificates').upload(path, file)
    if (upErr) { setError('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('certificates').getPublicUrl(path)
    setFileUrl(data.publicUrl); setFileName(file.name)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title required'); return }
    if (!form.activity_category) { setError('Category required'); return }
    if (!form.activity_level) { setError('Level required'); return }
    if (!form.activity_role) { setError('Role required'); return }
    if (!fileUrl) { setError('Please upload the certificate file'); return }
    setLoading(true)
    const { error: err } = await supabase.from('certificates').insert({
      profile_id: userId, title: form.title.trim(), description: form.description || null,
      activity_category: form.activity_category, activity_level: form.activity_level,
      activity_role: form.activity_role, file_url: fileUrl,
      suggested_points: pts, status: 'pending',
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/certificates')
  }

  const cats = Object.keys(KTU)
  const levels = form.activity_category ? Object.keys(KTU[form.activity_category] ?? {}) : []
  const roles = form.activity_category && form.activity_level ? Object.keys(KTU[form.activity_category]?.[form.activity_level] ?? {}) : []

  return (
    <div className="page-sm">
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom:'20px' }}>← Back</button>
      <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Upload Certificate</h1>
      <p style={{ color:'var(--text2)', fontSize:'13px', margin:'0 0 24px' }}>Submit for faculty review to earn KTU activity points</p>
      {error && <div className="error-box" style={{ marginBottom:'16px' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

        <div className="card" style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <h3 style={{ margin:0, fontSize:'13px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.05em' }}>Certificate Details</h3>
          <div><label className="label">Title *</label><input className="input" placeholder="e.g. First Place – State Hackathon" value={form.title} onChange={set('title')} /></div>
          <div><label className="label">Description</label>
            <textarea className="input" placeholder="Additional context about this achievement…" value={form.description} onChange={set('description') as any} rows={2} style={{ resize:'none' }} />
          </div>
        </div>

        <div className="card" style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <h3 style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.05em' }}>KTU Points Calculator</h3>
            <p style={{ color:'var(--text3)', fontSize:'12px', margin:0 }}>Points are calculated based on KTU regulations</p>
          </div>
          <div><label className="label">Activity Category *</label>
            <select className="input" value={form.activity_category} onChange={e => setForm(p => ({ ...p, activity_category:e.target.value, activity_level:'', activity_role:'' }))}>
              <option value="">Select category</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div><label className="label">Level *</label>
              <select className="input" value={form.activity_level} onChange={e => setForm(p => ({ ...p, activity_level:e.target.value, activity_role:'' }))} disabled={!form.activity_category}>
                <option value="">Select level</option>{levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div><label className="label">Your Role *</label>
              <select className="input" value={form.activity_role} onChange={set('activity_role')} disabled={!form.activity_level}>
                <option value="">Select role</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {pts > 0 && (
            <div style={{ background:'var(--amber-dim)', border:'1px solid var(--amber-border)', borderRadius:'10px', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ color:'var(--amber)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 2px' }}>Suggested Points</p>
                <p style={{ color:'var(--text3)', fontSize:'11px', margin:0 }}>Faculty may adjust during review</p>
              </div>
              <p style={{ color:'var(--amber)', fontSize:'36px', fontWeight:800, margin:0, lineHeight:1 }}>{pts}</p>
            </div>
          )}
        </div>

        <div className="card" style={{ padding:'20px' }}>
          <h3 style={{ margin:'0 0 4px', fontSize:'13px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.05em' }}>Certificate File *</h3>
          <p style={{ color:'var(--text3)', fontSize:'12px', margin:'0 0 12px' }}>PDF or image, max 5MB</p>
          {fileUrl ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--green-dim)', border:'1px solid rgba(16,185,129,.2)', borderRadius:'10px', padding:'12px 16px' }}>
              <div>
                <p style={{ color:'var(--green)', fontSize:'13px', fontWeight:600, margin:'0 0 2px' }}>✓ Uploaded</p>
                <p style={{ color:'var(--text3)', fontSize:'11px', margin:0 }}>{fileName}</p>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs">View</a>
                <button type="button" onClick={() => { setFileUrl(''); setFileName('') }} className="btn btn-danger btn-xs">Remove</button>
              </div>
            </div>
          ) : (
            <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border2)', borderRadius:'10px', padding:'32px', cursor: uploading ? 'wait' : 'pointer', transition:'border-color .2s', background: uploading ? 'var(--surface2)' : 'transparent' }}>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} disabled={uploading} style={{ display:'none' }} />
              {uploading ? <div className="spinner" /> : <>
                <p style={{ fontSize:'28px', margin:'0 0 8px' }}>📎</p>
                <p style={{ color:'var(--text)', fontSize:'13px', fontWeight:600, margin:'0 0 4px' }}>Click to upload</p>
                <p style={{ color:'var(--text3)', fontSize:'12px', margin:0 }}>PDF, JPG, PNG up to 5MB</p>
              </>}
            </label>
          )}
        </div>

        <button type="submit" disabled={loading||uploading||!userId} className="btn btn-primary" style={{ width:'100%', padding:'12px' }}>
          {loading ? <><span className="spinner"/>Submitting…</> : 'Submit for Review →'}
        </button>
      </form>
    </div>
  )
}