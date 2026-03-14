'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, KTU_CATEGORIES, ACTIVITY_LEVELS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function CreateEventPage() {
  const { id } = useParams()
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [community, setCommunity] = useState<any>(null)
  const [scheme, setScheme] = useState('2019')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [regDeadline, setRegDeadline] = useState('')
  const [venue, setVenue] = useState('')
  const [ktuCategory, setKtuCategory] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [suggestedPoints, setSuggestedPoints] = useState(0)
  const [maxParticipants, setMaxParticipants] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: comm } = await supabase.from('communities').select('*, batches(scheme)').eq('id', id).single()
      setCommunity(comm)
      if (comm?.batches?.scheme) setScheme(comm.batches.scheme)
    }
    load()
  }, [id])

  // Auto-fetch suggested points when category + level selected
  useEffect(() => {
    if (!ktuCategory || !activityLevel) { setSuggestedPoints(0); return }
    const fetchPoints = async () => {
      const { data } = await supabase
        .from('ktu_rules')
        .select('base_points')
        .eq('scheme', scheme)
        .eq('category', ktuCategory)
        .eq('level', activityLevel)
        .single()
      setSuggestedPoints(data?.base_points || 0)
    }
    fetchPoints()
  }, [ktuCategory, activityLevel, scheme])

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!eventDate) { setError('Event date is required'); return }
    setSaving(true)
    setError('')
    try {
      const { error } = await supabase.from('events').insert({
        community_id: id,
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate,
        registration_deadline: regDeadline || null,
        venue: venue.trim() || null,
        ktu_category: ktuCategory || null,
        activity_level: activityLevel || null,
        suggested_points: suggestedPoints,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        created_by: userId,
        banner_index: Math.floor(Math.random() * 8),
      })
      if (error) throw error
      router.push(`/communities/${id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to create event')
      setSaving(false)
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Create Event</h1>
          <p className="page-subtitle">{community?.name}</p>
        </div>

        <div style={{ maxWidth: '560px' }}>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Event Details</h3>
            <div className="input-group">
              <label className="input-label">Event Title *</label>
              <input className="input" placeholder="e.g. Web Dev Workshop" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea className="input" placeholder="What's this event about?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Event Date *</label>
                <input type="datetime-local" className="input" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Registration Deadline</label>
                <input type="datetime-local" className="input" value={regDeadline} onChange={e => setRegDeadline(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Venue</label>
                <input className="input" placeholder="e.g. Seminar Hall" value={venue} onChange={e => setVenue(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Max Participants</label>
                <input type="number" className="input" placeholder="Leave blank for unlimited" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KTU Activity Points</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">KTU Category</label>
                <select className="input" value={ktuCategory} onChange={e => setKtuCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {KTU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Activity Level</label>
                <select className="input" value={activityLevel} onChange={e => setActivityLevel(e.target.value)}>
                  <option value="">Select level</option>
                  {ACTIVITY_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
            </div>
            {suggestedPoints > 0 && (
              <div style={{
                background: 'var(--green-glow)', border: '1px solid #3ecf8e20',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--green)' }}>
                    {suggestedPoints} activity points
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Based on KTU {scheme} scheme · {ktuCategory} · {activityLevel} level
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Creating...</> : 'Create Event'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}