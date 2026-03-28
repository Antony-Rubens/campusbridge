'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateSuggestedPoints } from '@/lib/activityPoints'
import Sidebar from '@/components/Sidebar'

export default function FacultyPage() {
  const [profile, setProfile] = useState<any>(null)
  const [pending, setPending] = useState<any[]>([])
  const [recentlyReviewed, setRecentlyReviewed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      const { data: pendingCerts } = await supabase
        .from('certificates')
        .select('*, profiles!certificates_profile_id_fkey(id, full_name, roll_number, scheme, faculty_coordinator_id, departments(name))')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      const mine = (pendingCerts || []).filter(c => c.profiles?.faculty_coordinator_id === user.id)
      setPending(mine)

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: reviewed } = await supabase
        .from('certificates')
        .select('*, profiles!certificates_profile_id_fkey(full_name, roll_number)')
        .eq('reviewed_by', user.id)
        .gte('reviewed_at', sevenDaysAgo)
        .order('reviewed_at', { ascending: false })
        .limit(10)
      setRecentlyReviewed(reviewed || [])

      setLoading(false)
    }
    load()
  }, [])

  const getFileUrl = async (cert: any) => {
    if (fileUrls[cert.id]) return fileUrls[cert.id]
    if (!cert.file_path || cert.file_deleted) return null
    const { data } = await supabase.storage.from('certificates').createSignedUrl(cert.file_path, 3600)
    if (data?.signedUrl) {
      setFileUrls(prev => ({ ...prev, [cert.id]: data.signedUrl }))
      return data.signedUrl
    }
    return null
  }

  const handleApprove = async (cert: any) => {
    setReviewingId(cert.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const studentScheme = cert.profiles?.scheme ?? '2024'

      const { suggestedPoints } = await calculateSuggestedPoints({
        profileId: cert.profile_id,
        scheme: studentScheme,
        subActivityCode: cert.sub_activity_code ?? 'unknown',
        eventLevel: cert.event_level ?? null,
        achievementType: cert.achievement_type ?? 'fixed',
      })

      // 1. Insert the activity point record FIRST
      const { error: recordError } = await supabase.from('activity_point_records').insert({
        profile_id: cert.profile_id,
        certificate_id: cert.id,
        scheme: studentScheme,
        group_number: cert.group_number ?? null,
        segment: cert.segment ?? null,
        sub_activity_code: cert.sub_activity_code ?? null,
        event_level: cert.event_level ?? null,
        achievement_type: cert.achievement_type ?? null,
        awarded_points: suggestedPoints,
        approved_by: user.id,
      })
      if (recordError) throw new Error(`Failed to save points record: ${recordError.message}`)

      // 2. Update the certificate status
      const { error: certError } = await supabase.from('certificates').update({
        status: 'approved',
        awarded_points: suggestedPoints,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        faculty_remarks: remarks[cert.id] || null,
      }).eq('id', cert.id)
      if (certError) throw new Error(`Failed to update certificate status: ${certError.message}`)

      // 3. Send the notification
      const { error: notifError } = await supabase.from('notifications').insert({
        profile_id: cert.profile_id,
        type: 'certificate_approved',
        title: 'Certificate Approved',
        body: `Your certificate "${cert.title}" was approved. You earned ${suggestedPoints} activity points.`,
        related_id: cert.id,
      })
      if (notifError) console.warn('Notification failed:', notifError.message)

      // 4. Update UI ONLY if DB calls succeed
      setPending(prev => prev.filter(c => c.id !== cert.id))
      setRecentlyReviewed(prev => [{ ...cert, status: 'approved', awarded_points: suggestedPoints }, ...prev])

    } catch (e: any) {
      console.error('Approve error:', e)
      alert(`Approval failed: ${e.message}`)
    } finally {
      setReviewingId(null)
    }
  }

  const handleReject = async (cert: any) => {
    if (!remarks[cert.id]?.trim()) {
      alert('Please enter a reason for rejection.')
      return
    }
    setReviewingId(cert.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: certError } = await supabase.from('certificates').update({
        status: 'rejected',
        awarded_points: null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        faculty_remarks: remarks[cert.id],
      }).eq('id', cert.id)
      if (certError) throw new Error(`Failed to update certificate: ${certError.message}`)

      const { error: notifError } = await supabase.from('notifications').insert({
        profile_id: cert.profile_id,
        type: 'certificate_rejected',
        title: 'Certificate Rejected',
        body: `Your certificate "${cert.title}" was rejected. Reason: ${remarks[cert.id]}`,
        related_id: cert.id,
      })
      if (notifError) console.warn('Notification failed:', notifError.message)

      setPending(prev => prev.filter(c => c.id !== cert.id))
      setRecentlyReviewed(prev => [{ ...cert, status: 'rejected' }, ...prev])

    } catch (e: any) {
      console.error('Reject error:', e)
      alert(`Rejection failed: ${e.message}`)
    } finally {
      setReviewingId(null)
    }
  }

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
          <h1 className="page-title">Faculty Dashboard</h1>
          <p className="page-subtitle">{profile?.full_name} · {profile?.departments?.name}</p>
        </div>

        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{pending.length}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>
              {recentlyReviewed.filter(c => c.status === 'approved').length}
            </div>
            <div className="stat-label">Approved (7 days)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--red)' }}>
              {recentlyReviewed.filter(c => c.status === 'rejected').length}
            </div>
            <div className="stat-label">Rejected (7 days)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{recentlyReviewed.length}</div>
            <div className="stat-label">Total Reviewed</div>
          </div>
        </div>

        <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Pending Certificates ({pending.length})
        </h3>

        {pending.length === 0 ? (
          <div className="empty-state" style={{ marginBottom: '28px' }}>
            <div className="empty-icon">✅</div>
            <div className="empty-title">All caught up</div>
            <div className="empty-desc">No certificates pending review</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {pending.map(cert => (
              <div key={cert.id} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '3px' }}>{cert.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {cert.profiles?.full_name} · {cert.profiles?.roll_number} · KTU {cert.profiles?.scheme ?? '2024'} Scheme
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)', lineHeight: 1 }}>
                      {cert.suggested_points}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>suggested pts</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {cert.sub_activity_code && (
                    <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                      {cert.sub_activity_code} — {cert.sub_activity_name}
                    </span>
                  )}
                  {cert.event_level && (
                    <span className="badge badge-gray" style={{ fontSize: '10px' }}>{cert.event_level} level</span>
                  )}
                  {cert.achievement_type && (
                    <span className="badge badge-gray" style={{ fontSize: '10px' }}>
                      {cert.achievement_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {cert.group_number && (
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>Group {cert.group_number}</span>
                  )}
                  {cert.segment && (
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>{cert.segment}</span>
                  )}
                </div>

                {cert.file_path && !cert.file_deleted && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '12px', marginBottom: '12px' }}
                    onClick={async () => {
                      const url = await getFileUrl(cert)
                      if (url) window.open(url, '_blank')
                    }}
                  >
                    📄 View Certificate
                  </button>
                )}

                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label className="input-label">Faculty Remarks (required for rejection)</label>
                  <input
                    className="input"
                    placeholder="Add remarks…"
                    value={remarks[cert.id] || ''}
                    onChange={e => setRemarks(prev => ({ ...prev, [cert.id]: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={reviewingId === cert.id}
                    onClick={() => handleApprove(cert)}
                  >
                    {reviewingId === cert.id
                      ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Processing…</>
                      : `✓ Approve (+${cert.suggested_points} pts)`}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, color: 'var(--red)', borderColor: 'var(--red)' }}
                    disabled={reviewingId === cert.id}
                    onClick={() => handleReject(cert)}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {recentlyReviewed.length > 0 && (
          <>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Recently Reviewed (last 7 days)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentlyReviewed.map(cert => (
                <div key={cert.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                  <span className={`dot dot-${cert.status === 'approved' ? 'green' : 'red'}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{cert.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{cert.profiles?.full_name}</div>
                  </div>
                  <span className={`badge badge-${cert.status === 'approved' ? 'green' : 'red'}`} style={{ fontSize: '10px' }}>
                    {cert.status === 'approved' ? `+${cert.awarded_points} pts` : 'Rejected'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}