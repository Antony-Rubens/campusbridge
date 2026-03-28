'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateSuggestedPoints } from '@/lib/activityPoints'
import Sidebar from '@/components/Sidebar'

const GROUPS_2024 = [
  { value: 1, label: 'Group I — Sports, Arts & Cultural' },
  { value: 2, label: 'Group II — Technical, Competitions & Academic' },
  { value: 3, label: 'Group III — Industry, Innovation & Research' },
]

const SEGMENTS_2019 = [
  { value: '1-national',         label: 'National Initiatives' },
  { value: '2-sports',           label: 'Sports & Games' },
  { value: '3-cultural',         label: 'Cultural Activities' },
  { value: '4-professional',     label: 'Professional Self Initiatives' },
  { value: '5-entrepreneurship', label: 'Entrepreneurship & Innovation' },
  { value: '6-leadership',       label: 'Leadership & Management' },
]

const EVENT_LEVELS = [
  { value: 'college',       label: 'College (L1)' },
  { value: 'zonal',         label: 'Zonal (L2)' },
  { value: 'state',         label: 'State (L3)' },
  { value: 'national',      label: 'National (L4)' },
  { value: 'international', label: 'International (L5)' },
]

const ACHIEVEMENT_TYPES_2024 = [
  { value: 'participation',  label: 'Participation' },
  { value: 'winner_single',  label: 'Winner (Single event)' },
  { value: 'winner_group',   label: 'Winner (Group event)' },
  { value: 'fixed',          label: 'Fixed / Flat points' },
  { value: 'tier_1',         label: 'Tier 1 (highest)' },
  { value: 'tier_2',         label: 'Tier 2 (mid)' },
  { value: 'tier_3',         label: 'Tier 3 (lowest qualifying)' },
]

const ACHIEVEMENT_TYPES_2019 = [
  { value: 'participation',  label: 'Participation only' },
  { value: 'first_prize',    label: 'First Prize' },
  { value: 'second_prize',   label: 'Second Prize' },
  { value: 'third_prize',    label: 'Third Prize' },
  { value: 'fixed',          label: 'Fixed / Flat points' },
  { value: 'tier_1',         label: 'Tier 1 (highest)' },
  { value: 'tier_2',         label: 'Tier 2 (mid)' },
  { value: 'tier_3',         label: 'Tier 3 (lowest qualifying)' },
]

const LEVEL_BASED = ['participation','winner_single','winner_group','first_prize','second_prize','third_prize']

export default function UploadCertificatePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [groupNumber, setGroupNumber] = useState<number | null>(null)
  const [segment, setSegment] = useState('')
  const [subActivities, setSubActivities] = useState<any[]>([])
  const [subActivityCode, setSubActivityCode] = useState('')
  const [subActivityName, setSubActivityName] = useState('')
  const [eventLevel, setEventLevel] = useState('')
  const [achievementType, setAchievementType] = useState('')
  const [preview, setPreview] = useState<{ suggestedPoints: number; maxPoints: number; alreadyEarned: number } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const scheme = profile?.scheme ?? '2024'
  const is2024 = scheme === '2024'

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, scheme, faculty_coordinator_id, departments(name)')
        .eq('id', user.id)
        .single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

  // Load sub-activities when group or segment changes
  useEffect(() => {
    const fetch = async () => {
      if (!profile) return
      if (is2024 && !groupNumber) { setSubActivities([]); return }
      if (!is2024 && !segment) { setSubActivities([]); return }

      let query = supabase
        .from('ktu_rules')
        .select('sub_activity_code, sub_activity_name')
        .eq('scheme', scheme)

      if (is2024) query = query.eq('group_number', groupNumber)
      else query = query.eq('segment', segment)

      const { data } = await query.order('sub_activity_code')
      setSubActivities(data || [])
      setSubActivityCode('')
      setSubActivityName('')
      setAchievementType('')
      setEventLevel('')
      setPreview(null)
    }
    fetch()
  }, [groupNumber, segment, profile])

  // Live points preview
  useEffect(() => {
    const fetchPreview = async () => {
      if (!profile || !subActivityCode || !achievementType) { setPreview(null); return }
      setPreviewLoading(true)
      const result = await calculateSuggestedPoints({
        profileId: profile.id,
        scheme,
        subActivityCode,
        eventLevel: eventLevel || null,
        achievementType,
      })
      setPreview(result)
      setPreviewLoading(false)
    }
    fetchPreview()
  }, [subActivityCode, eventLevel, achievementType, profile])

  const handleSubmit = async () => {
    if (!title.trim())       { setError('Please enter a title.'); return }
    if (!subActivityCode)    { setError('Please select a sub-activity.'); return }
    if (!achievementType)    { setError('Please select an achievement type.'); return }
    if (!file)               { setError('Please attach a certificate file.'); return }
    if (!profile?.faculty_coordinator_id) {
      setError('No faculty coordinator assigned. Go to your profile and set one first.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const ext = file.name.split('.').pop()
      const filePath = `certificates/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, file)
      if (uploadError) throw uploadError

      const { suggestedPoints } = await calculateSuggestedPoints({
        profileId: user.id,
        scheme,
        subActivityCode,
        eventLevel: eventLevel || null,
        achievementType,
      })

      const { error: insertError } = await supabase.from('certificates').insert({
        profile_id: user.id,
        title: title.trim(),
        scheme,
        group_number: is2024 ? groupNumber : null,
        segment: !is2024 ? segment : null,
        sub_activity_code: subActivityCode,
        sub_activity_name: subActivityName,
        event_level: eventLevel || null,
        achievement_type: achievementType,
        suggested_points: suggestedPoints,
        awarded_points: null,
        status: 'pending',
        file_path: filePath,
        file_deleted: false,
      })
      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => router.push('/certificates'), 1500)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  const needsLevel = LEVEL_BASED.includes(achievementType)

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Upload Certificate</h1>
          <p className="page-subtitle">KTU {scheme} Scheme · {profile?.departments?.name}</p>
        </div>

        <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="card">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Certificate Title</label>
              <input className="input" placeholder="e.g. First Prize in State Basketball" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">{is2024 ? 'Activity Group' : 'Activity Segment'}</label>
              {is2024 ? (
                <select className="input" value={groupNumber ?? ''} onChange={e => { setGroupNumber(Number(e.target.value)); setSubActivityCode(''); setPreview(null) }}>
                  <option value="">Select group…</option>
                  {GROUPS_2024.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              ) : (
                <select className="input" value={segment} onChange={e => { setSegment(e.target.value); setSubActivityCode(''); setPreview(null) }}>
                  <option value="">Select segment…</option>
                  {SEGMENTS_2019.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}
            </div>
          </div>

          {subActivities.length > 0 && (
            <div className="card">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Sub-activity</label>
                <select
                  className="input"
                  value={subActivityCode}
                  onChange={e => {
                    const selected = subActivities.find(a => a.sub_activity_code === e.target.value)
                    setSubActivityCode(e.target.value)
                    setSubActivityName(selected?.sub_activity_name ?? '')
                    setAchievementType('')
                    setEventLevel('')
                    setPreview(null)
                  }}
                >
                  <option value="">Select sub-activity…</option>
                  {subActivities.map(a => (
                    <option key={a.sub_activity_code} value={a.sub_activity_code}>
                      {a.sub_activity_code} — {a.sub_activity_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {subActivityCode && (
            <div className="card">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Achievement Type</label>
                <select className="input" value={achievementType} onChange={e => { setAchievementType(e.target.value); setPreview(null) }}>
                  <option value="">Select type…</option>
                  {(is2024 ? ACHIEVEMENT_TYPES_2024 : ACHIEVEMENT_TYPES_2019).map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {subActivityCode && needsLevel && (
            <div className="card">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Event Level</label>
                <select className="input" value={eventLevel} onChange={e => setEventLevel(e.target.value)}>
                  <option value="">Select level…</option>
                  {EVENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {(preview || previewLoading) && (
            <div className="card" style={{ background: 'var(--accent-glow)', border: '1px solid #4f8ef720' }}>
              {previewLoading ? (
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Calculating points…</div>
              ) : preview && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Points Preview
                  </div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: preview.suggestedPoints > 0 ? 'var(--accent)' : 'var(--red)', lineHeight: 1 }}>
                        {preview.suggestedPoints}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>suggested points</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-2)', lineHeight: 1 }}>{preview.maxPoints}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>max for this activity</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-2)', lineHeight: 1 }}>{preview.alreadyEarned}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>already earned</div>
                    </div>
                  </div>
                  {preview.suggestedPoints === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '8px' }}>
                      ⚠ Max points already reached for this activity, or a higher-level record exists.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Certificate File (PDF or image)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'var(--green-glow)', border: '1px solid #3ecf8e20', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--green)' }}>
              ✓ Certificate submitted! Redirecting…
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || success}>
            {submitting
              ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Uploading…</>
              : 'Submit Certificate'}
          </button>
        </div>
      </main>
    </div>
  )
}