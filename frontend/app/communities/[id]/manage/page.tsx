'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ManageCommunityPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [community, setCommunity] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '', category: '', department: '' })

  const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Social', 'Professional', 'Other']
  const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'MCA', 'MBA', 'All Departments']

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)

      const { data: comm } = await supabase.from('communities').select('*').eq('id', id).single()
      if (!comm || comm.created_by !== session.user.id) { router.push('/communities'); return }

      setCommunity(comm)
      setForm({ name: comm.name, description: comm.description ?? '', category: comm.category ?? '', department: comm.department ?? '' })

      const { data: mems } = await supabase
        .from('community_members')
        .select('*, profile:profiles(full_name, department, role)')
        .eq('community_id', id)

      setMembers(mems ?? [])
      setLoading(false)
    }
    load()
  }, [id, router])

  const handleSave = async () => {
    setSaving(true)
    const { error: err } = await supabase.from('communities').update({
      name: form.name,
      description: form.description || null,
      category: form.category,
      department: form.department || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (err) setError(err.message)
    setSaving(false)
  }

  const handleRoleChange = async (profileId: string, role: string) => {
    await supabase.from('community_members').update({ role }).eq('community_id', id).eq('profile_id', profileId)
    setMembers(prev => prev.map(m => m.profile_id === profileId ? { ...m, role } : m))
  }

  const handleRemoveMember = async (profileId: string) => {
    await supabase.from('community_members').delete().eq('community_id', id).eq('profile_id', profileId)
    setMembers(prev => prev.filter(m => m.profile_id !== profileId))
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link href={`/communities/${id}`} className="text-slate-400 hover:text-white text-sm transition block mb-3">← Back to Community</Link>
          <h1 className="text-2xl font-black text-white">Manage Community</h1>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

        {/* Edit details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Community Details</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Name</label>
            <input value={form.name} onChange={set('name')}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Department</label>
              <select value={form.department} onChange={set('department')}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                <option value="">All</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Members */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Members ({members.length})</h2>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.profile_id} className="flex items-center justify-between gap-3 bg-slate-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-semibold">{m.profile?.full_name}</p>
                  <p className="text-slate-500 text-xs">{m.profile?.department} · {m.profile?.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.profile_id !== userId && (
                    <>
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m.profile_id, e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m.profile_id)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1.5 rounded-lg hover:bg-red-900/20 transition"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {m.profile_id === userId && (
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full">Owner</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6">
          <h2 className="text-red-400 font-bold mb-3">Danger Zone</h2>
          <button
            onClick={async () => {
              if (!confirm('Are you sure? This will deactivate the community.')) return
              await supabase.from('communities').update({ is_active: false }).eq('id', id)
              router.push('/communities')
            }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            Deactivate Community
          </button>
        </div>
      </div>
    </div>
  )
}