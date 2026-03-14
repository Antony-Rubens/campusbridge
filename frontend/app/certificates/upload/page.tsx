'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, KTU_CATEGORIES, ACTIVITY_LEVELS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const MAX_SIZE = 5 * 1024 * 1024

export default function UploadCertificatePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState('')

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')

  const [suggestedPoints, setSuggestedPoints] = useState<number | null>(null)
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [finalPoints, setFinalPoints] = useState<number | null>(null)
  const [ruleData, setRuleData] = useState<any>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('*, faculty_coordinator:faculty_coordinator_id(full_name)')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    load()
  }, [])

  // Auto-calculate points when category + level changes
  useEffect(() => {
    if (!category || !level || !profile) { setSuggestedPoints(null); setFinalPoints(null); return }
    const calculate = async () => {
      const scheme = profile.scheme || '2019'

      // Fetch KTU rule
      const { data: rule } = await supabase
        .from('ktu_rules')
        .select('*')
        .eq('scheme', scheme)
        .eq('category', category)
        .eq('level', level)
        .single()

      if (!rule) { setSuggestedPoints(0); setFinalPoints(0); return }
      setRuleData(rule)

      // Check how many times this category has been approved before
      const { data: prevRecords } = await supabase
        .from('activity_point_records')
        .select('attempt_number')
        .eq('profile_id', userId)
        .eq('category', category)
        .order('attempt_number', { ascending: false })

      const attempt = (prevRecords?.[0]?.attempt_number || 0) + 1
      setAttemptNumber(attempt)

      const base = rule.base_points
      let pts = base
      if (attempt === 2) pts = Math.round(base * rule.attempt_2_multiplier)
      if (attempt >= 3) pts = Math.round(base * rule.attempt_3_multiplier)

      // Check category cap
      const { data: catRecords } = await supabase
        .from('activity_point_records')
        .select('awarded_points')
        .eq('profile_id', userId)
        .eq('category', category)
      const catTotal = catRecords?.reduce((s: number, r: any) => s + r.awarded_points, 0) || 0
      const remaining = rule.max_points_per_category - catTotal
      pts = Math.min(pts, remaining)

      setSuggestedPoints(base)
      setFinalPoints(Math.max(0, pts))
    }
    calculate()
  }, [category, level, profile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFileError('')
    if (!f) return
    if (f.type !== 'application/pdf') { setFileError('Only PDF files are allowed.'); return }
    if (f.size > MAX_SIZE) { setFileError('File must be under 5MB.'); return }
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Certificate title is required'); return }
    if (!category) { setError('Please select a category'); return }
    if (!level) { setError('Please select an activity level'); return }
    if (!file) { setError('Please upload a PDF certificate'); return }
    if (!profile?.faculty_coordinator_id) {
      setError('You have no faculty coordinator assigned. Please update your profile first.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Upload file to storage
      const filePath = `${userId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file, { contentType: 'application/pdf' })
      if (uploadError) throw uploadError

      // Create certificate record
      const { error: dbError } = await supabase.from('certificates').insert({
        profile_id: userId,
        title: title.trim(),
        activity_category: category,
        activity_level: level,
        file_path: filePath,
        file_deleted: false,
        status: 'pending',
        suggested_points: finalPoints ?? 0,
        awarded_points: null,
      })
      if (dbError) throw dbError

      router.push('/certificates')
    } catch (e: any) {
      setError(e.message || 'Upload failed. Try again.')
      setSaving(false)
    }
  }

  const diminishingLabel = () => {
    if (attemptNumber === 1) return null
    if (attemptNumber === 2) return `2nd attempt in ${category} — 50% of base points`
    return `3rd+ attempt in ${category} — 25% of base points`
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Upload Certificate</h1>
          <p className="page-subtitle">Submit proof of participation for KTU activity point review</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', maxWidth: '860px' }}>
          {/* Form */}
          <div>
            {!profile?.faculty_coordinator_id && (
              <div style={{
                background: 'var(--red-glow)', border: '1px solid #f8717120',
                borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: '16px', fontSize: '13px', color: 'var(--red)',
              }}>
                ⚠️ No faculty coordinator assigned. Your certificate cannot be reviewed.{' '}
                <a href="/profile" style={{ color: 'var(--red)', fontWeight: '600', textDecoration: 'underline' }}>Fix in Profile →</a>
              </div>
            )}

            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Certificate Details</h3>
              <div className="input-group">
                <label className="input-label">Certificate / Event Title *</label>
                <input className="input" placeholder="e.g. 1st Place — State Level Chess Tournament" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">KTU Activity Category *</label>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {KTU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Activity Level *</label>
                  <select className="input" value={level} onChange={e => setLevel(e.target.value)}>
                    <option value="">Select level</option>
                    {ACTIVITY_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upload PDF *</h3>
              <div style={{
                border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '28px',
                textAlign: 'center',
                transition: 'border-color 0.15s',
                background: file ? 'var(--accent-glow)' : 'transparent',
              }}>
                {file ? (
                  <div>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📄</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', marginBottom: '4px' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '12px' }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px', opacity: 0.4 }}>📎</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>Click to select PDF</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '12px' }}>PDF only · max 5MB</div>
                    <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                      Browse Files
                      <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>
              {fileError && <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '8px' }}>{fileError}</div>}
              <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '10px' }}>
                Your certificate will be reviewed by your faculty coordinator. The file will be deleted from storage after review.
              </p>
            </div>

            {error && (
              <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving
                  ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Uploading...</>
                  : 'Submit for Review'
                }
              </button>
            </div>
          </div>

          {/* Points preview */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Points Preview
              </h3>
              {finalPoints === null ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Select category and level to see estimated points</div>
                </div>
              ) : (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: finalPoints > 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-0.04em' }}>
                      +{finalPoints}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>estimated points</div>
                  </div>

                  <div className="divider" />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-3)' }}>Base points</span>
                      <span style={{ fontWeight: '600' }}>{suggestedPoints}</span>
                    </div>
                    {attemptNumber > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-3)' }}>Attempt #{attemptNumber}</span>
                        <span style={{ color: 'var(--yellow)', fontWeight: '600' }}>
                          ×{attemptNumber === 2 ? '0.5' : '0.25'}
                        </span>
                      </div>
                    )}
                    {ruleData && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-3)' }}>Category max</span>
                        <span style={{ fontWeight: '600' }}>{ruleData.max_points_per_category}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-3)' }}>Scheme</span>
                      <span style={{ fontWeight: '600' }}>{profile?.scheme || '2019'}</span>
                    </div>
                  </div>

                  {diminishingLabel() && (
                    <div style={{ marginTop: '14px', background: 'var(--yellow-glow)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '11px', color: 'var(--yellow)' }}>
                      ⚠️ {diminishingLabel()}
                    </div>
                  )}

                  {finalPoints === 0 && (
                    <div style={{ marginTop: '10px', background: 'var(--red-glow)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '11px', color: 'var(--red)' }}>
                      You've reached the maximum points for this category.
                    </div>
                  )}

                  <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '12px', lineHeight: '1.5' }}>
                    Final points are subject to faculty review and may be adjusted.
                  </p>
                </div>
              )}

              <div className="divider" />
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Coordinator: <span style={{ color: 'var(--text-2)', fontWeight: '500' }}>
                  {profile?.faculty_coordinator?.full_name || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}