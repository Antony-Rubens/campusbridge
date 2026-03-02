'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'MCA', 'MBA', 'Other']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function RegisterDetails() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    department: '',
    semester: '',
    skills: '',
    interests: '',
    github_link: '',
    linkedin_id: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      setUserEmail(session.user.email ?? '')
      setUserId(session.user.id)
      const name = session.user.user_metadata?.full_name ?? ''
      if (name) setForm(f => ({ ...f, full_name: name }))
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim()) { setError('Full name is required'); return }
    if (!form.department) { setError('Please select department'); return }
    if (!form.semester) { setError('Please select semester'); return }
    if (!userId) { setError('Not signed in. Please go back and sign in again.'); return }

    setLoading(true)

    const { error: err } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        full_name: form.full_name.trim(),
        department: form.department,
        semester: parseInt(form.semester),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
        github_link: form.github_link.trim() || null,
        linkedin_id: form.linkedin_id.trim() || null,
        role: 'student',
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (err) {
      setError(`Save failed: ${err.message} (${err.code})`)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-slate-950 flex items-start justify-center pt-8 px-4 pb-16">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Complete Your Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Signed in as <span className="text-white">{userEmail}</span></p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Yesudas M. P"
                value={form.full_name}
                onChange={set('full_name')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Department <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.department}
                  onChange={set('department')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Semester <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.semester}
                  onChange={set('semester')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Skills</label>
              <input
                type="text"
                placeholder="Python, React, Public Speaking"
                value={form.skills}
                onChange={set('skills')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Interests</label>
              <input
                type="text"
                placeholder="AI, Robotics, Music, Sports"
                value={form.interests}
                onChange={set('interests')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={form.github_link}
                  onChange={set('github_link')}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">LinkedIn ID</label>
                <input
                  type="text"
                  placeholder="your-linkedin-id"
                  value={form.linkedin_id}
                  onChange={set('linkedin_id')}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !userId}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl px-4 py-4 text-sm transition"
          >
            {loading ? 'Saving…' : 'Complete Registration →'}
          </button>
        </form>
      </div>
    </div>
  )
}