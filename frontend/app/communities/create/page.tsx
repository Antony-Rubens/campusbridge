'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Social', 'Professional', 'Other']
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'MCA', 'MBA', 'All Departments']

export default function CreateCommunityPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '', category: '', department: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)
    })
  }, [router])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.category) { setError('Category is required'); return }
    setLoading(true)

    const { data, error: err } = await supabase
      .from('communities')
      .insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        department: form.department || null,
        created_by: userId,
        is_active: true,
      })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }

    // Auto-add creator as admin
    await supabase.from('community_members').insert({
      community_id: data.id,
      profile_id: userId,
      role: 'admin',
    })

    router.push(`/communities/${data.id}/manage`)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm mb-6 block transition">← Back</button>
        <h1 className="text-2xl font-black text-white mb-1">Create a Community</h1>
        <p className="text-slate-400 text-sm mb-8">Build a space for students with shared interests</p>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Name <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. IEDC AISAT, NSS Unit 42" value={form.name} onChange={set('name')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
              <textarea placeholder="What does this community do?" value={form.description} onChange={set('description')} rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Category <span className="text-red-400">*</span></label>
                <select value={form.category} onChange={set('category')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Department</label>
                <select value={form.department} onChange={set('department')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">All</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading || !userId}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl py-4 text-sm transition">
            {loading ? 'Creating…' : 'Create Community →'}
          </button>
        </form>
      </div>
    </div>
  )
}