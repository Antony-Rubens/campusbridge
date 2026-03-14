'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Social', 'Professional']

export default function CreateCommunityPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Community name is required'); return }
    if (!category) { setError('Please select a category'); return }
    setSaving(true)
    setError('')
    try {
      const { data, error } = await supabase.from('communities').insert({
        name: name.trim(),
        description: description.trim() || null,
        type: 'general',
        category,
        created_by: userId,
        status: 'pending',
        is_active: false,
        banner_index: Math.floor(Math.random() * 8),
      }).select().single()

      if (error) throw error

      // Insert creator as admin member (will be activated on approval)
      await supabase.from('community_members').insert({
        community_id: data.id,
        profile_id: userId,
        role: 'admin',
      })

      router.push('/communities')
    } catch (e: any) {
      setError(e.message || 'Failed to create community')
      setSaving(false)
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Create Community</h1>
          <p className="page-subtitle">Your request will be reviewed by the system admin</p>
        </div>

        <div style={{ maxWidth: '520px' }}>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="input-group">
              <label className="input-label">Community Name *</label>
              <input className="input" placeholder="e.g. IEDC AISAT, IEEE SB, Drama Club" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">Category *</label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Description <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                className="input"
                placeholder="What is this community about?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px', background: 'var(--yellow-glow)', borderColor: '#f5c54220' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6' }}>
              ⚠️ Your community request will be sent to the system admin for approval. You'll be notified once it's approved or rejected. You'll automatically become the community admin after approval.
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid #f8717120', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Submitting...</> : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}