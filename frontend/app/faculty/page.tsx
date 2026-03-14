'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function Page() {
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [userId, setUserId] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [pdfUrl, setPdfUrl] = useState('')
  const [awardedPoints, setAwardedPoints] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Get students assigned to this faculty coordinator
      console.log('Faculty user ID:', user.id)

      const { data: students, error: sErr } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('faculty_coordinator_id', user.id)
        .eq('role', 'student')

      console.log('Students found:', students, 'Error:', JSON.stringify(sErr))

      if (!students || students.length === 0) {
        console.log('No students assigned to this faculty')
        setLoading(false)
        return
      }

      const studentIds = students.map(s => s.id)
      console.log('Student IDs:', studentIds)

      const { data, error: cErr } = await supabase
        .from('certificates')
        .select('*, profiles!certificates_profile_id_fkey(id, full_name, email, roll_number, scheme, departments(name), batches!profiles_batch_id_fkey(name))')
        .in('profile_id', studentIds)
        .order('created_at', { ascending: false })

      console.log('Certificates found:', data, 'Error:', JSON.stringify(cErr))
      setCerts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = certs.filter(c => c.status === tab)
  const counts = {
    pending: certs.filter(c => c.status === 'pending').length,
    approved: certs.filter(c => c.status === 'approved').length,
    rejected: certs.filter(c => c.status === 'rejected').length,
  }

  const openReview = async (cert: any) => {
    setSelected(cert)
    setAwardedPoints(cert.suggested_points?.toString() || '0')
    setRemarks('')
    setPdfUrl('')
    if (cert.file_path && !cert.file_deleted) {
      const { data } = await supabase.storage
        .from('certificates')
        .createSignedUrl(cert.file_path, 3600)
      if (data) setPdfUrl(data.signedUrl)
    }
  }

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selected) return
    setSubmitting(true)
    const pts = decision === 'approved' ? parseInt(awardedPoints) || 0 : 0

    await supabase.from('certificates').update({
      status: decision,
      awarded_points: pts,
      faculty_remarks: remarks.trim() || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      file_deleted: true,
    }).eq('id', selected.id)

    if (selected.file_path) {
      await supabase.storage.from('certificates').remove([selected.file_path])
    }

    if (decision === 'approved' && pts > 0) {
      const { data: prev } = await supabase
        .from('activity_point_records')
        .select('attempt_number')
        .eq('profile_id', selected.profile_id)
        .eq('category', selected.activity_category)
        .order('attempt_number', { ascending: false })
        .limit(1)

      await supabase.from('activity_point_records').insert({
        profile_id: selected.profile_id,
        certificate_id: selected.id,
        category: selected.activity_category,
        scheme: selected.profiles?.scheme || '2019',
        awarded_points: pts,
        attempt_number: (prev?.[0]?.attempt_number || 0) + 1,
        approved_by: userId,
      })
    }

    await supabase.from('notifications').insert({
      profile_id: selected.profile_id,
      type: decision === 'approved' ? 'certificate_approved' : 'certificate_rejected',
      title: decision === 'approved' ? `Certificate approved — +${pts} points` : 'Certificate rejected',
      body: decision === 'approved'
        ? `Your certificate "${selected.title}" was approved. ${pts} activity points added.`
        : `Your certificate "${selected.title}" was rejected.${remarks ? ` Remark: ${remarks}` : ''}`,
      is_read: false,
      related_id: selected.id,
    })

    setCerts(prev => prev.map(c => c.id === selected.id
      ? { ...c, status: decision, awarded_points: pts, faculty_remarks: remarks }
      : c
    ))
    setSelected(null)
    setSubmitting(false)
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Review Portal</h1>
          <p className="page-subtitle">Certificate verification and activity point approval</p>
        </div>

        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{counts.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{counts.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--red)' }}>{counts.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>

        <div className="tabs">
          {(['pending', 'approved', 'rejected'] as const).map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No {tab} certificates</div>
            <div className="empty-desc">
              {tab === 'pending' && certs.length === 0 ? 'No students are assigned to you yet, or they haven\'t uploaded any certificates.' : ''}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(cert => (
              <div key={cert.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>{cert.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {cert.profiles?.full_name} · {cert.profiles?.roll_number} · {cert.profiles?.departments?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {cert.activity_category} · {cert.activity_level} · Scheme {cert.profiles?.scheme || '2019'}
                  </div>
                  {cert.faculty_remarks && (
                    <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>Remark: {cert.faculty_remarks}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: cert.status === 'approved' ? 'var(--green)' : 'var(--text-3)', marginBottom: '4px' }}>
                    {cert.status === 'approved' ? `+${cert.awarded_points} pts` : `${cert.suggested_points} est.`}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px' }}>
                    {new Date(cert.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  {cert.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => openReview(cert)}>Review →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selected && (
          <div style={{
            position: 'fixed', inset: 0, background: '#00000080', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }} onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
            <div style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '800px',
              maxHeight: '90vh', overflow: 'auto', padding: '28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ marginBottom: '4px' }}>{selected.title}</h2>
                  <p style={{ fontSize: '13px' }}>
                    {selected.profiles?.full_name} · {selected.profiles?.roll_number} · {selected.profiles?.departments?.name}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕ Close</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Certificate PDF
                  </div>
                  {selected.file_deleted ? (
                    <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                      File deleted after review
                    </div>
                  ) : pdfUrl ? (
                    <iframe src={pdfUrl} style={{ width: '100%', height: '400px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                  ) : (
                    <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center' }}>
                      <div className="spinner" />
                    </div>
                  )}
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: '8px', display: 'inline-flex' }}>
                      Open in new tab ↗
                    </a>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                    Review Decision
                  </div>
                  <div className="card" style={{ marginBottom: '14px' }}>
                    {[
                      { label: 'Category', val: selected.activity_category },
                      { label: 'Level', val: selected.activity_level },
                      { label: 'Scheme', val: selected.profiles?.scheme || '2019' },
                      { label: 'Suggested Points', val: selected.suggested_points },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-3)' }}>{label}</span>
                        <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Points to Award</label>
                    <input type="number" className="input" value={awardedPoints} onChange={e => setAwardedPoints(e.target.value)} min="0" max="100" />
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                      Suggested: {selected.suggested_points} pts. You can modify.
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <label className="input-label">Remarks <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(required if rejecting)</span></label>
                    <textarea className="input" placeholder="Add remarks for the student..." value={remarks} onChange={e => setRemarks(e.target.value)} style={{ minHeight: '80px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-success" onClick={() => handleDecision('approved')} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                      {submitting ? '...' : `✓ Approve (+${awardedPoints} pts)`}
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDecision('rejected')} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                      {submitting ? '...' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}