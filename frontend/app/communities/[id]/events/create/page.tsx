'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const KTU_CATEGORIES = ['NSS/NCC/NSO', 'Sports', 'Arts', 'Professional Body', 'Entrepreneurship', 'Leadership', 'MOOC']
const KTU_LEVELS = ['College', 'University', 'State', 'National', 'International']

export default function CreateEventPage() {
  const router = useRouter()
  const { id: communityId } = useParams() as { id: string }
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    ktu_category: '',
    ktu_level: '',
    activity_points: '',
    max_participants: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)

      // Verify user is admin of this community
      const { data } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('profile_id', session.user.id)
        .single()

      if (!data || !['admin', 'moderator'].includes(data.role)) {
        router.push(`/communities/${communityId}`)
      }
    })
  }, [communityId, router])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.event_date) { setError('Event date is required'); return }
    setLoading(true)

    const { error: err } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      location: form.location.trim() || null,
      community_id: communityId,
      ktu_category: form.ktu_category || null,
      ktu_level: form.ktu_level || null,
      activity_points: form.activity_points ? parseInt(form.activity_points) : 0,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      created_by: userId,
      is_published: true,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/communities/${communityId}`)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link href={`/communities/${communityId}`} className="text-slate-400 hover:text-white text-sm transition block mb-6">← Back to Community</Link>
        <h1 className="text-2xl font-black text-white mb-1">Create Event</h1>
        <p className="text-slate-400 text-sm mb-8">Add an event for your community members</p>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Event Title <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. Inter-College Hackathon 2025" value={form.title} onChange={set('title')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
              <textarea placeholder="What's this event about?" value={form.description} onChange={set('description')} rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date <span className="text-red-400">*</span></label>
                <input type="datetime-local" value={form.event_date} onChange={set('event_date')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
                <input type="text" placeholder="Seminar Hall, Online…" value={form.location} onChange={set('location')}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* KTU Points section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-white font-bold text-sm">KTU Activity Points</h3>
              <p className="text-slate-500 text-xs mt-0.5">Configure if this event awards activity points</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">KTU Category</label>
                <select value={form.ktu_category} onChange={set('ktu_category')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">None</option>
                  {KTU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Level</label>
                <select value={form.ktu_level} onChange={set('ktu_level')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">None</option>
                  {KTU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Activity Points</label>
                <input type="number" min="0" max="100" placeholder="0" value={form.activity_points} onChange={set('activity_points')}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Max Participants</label>
                <input type="number" min="1" placeholder="Unlimited" value={form.max_participants} onChange={set('max_participants')}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !userId}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl py-4 text-sm transition">
            {loading ? 'Creating…' : 'Publish Event →'}
          </button>
        </form>
      </div>
    </div>
  )
}