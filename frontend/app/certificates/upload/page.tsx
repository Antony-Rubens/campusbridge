'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// KTU Activity Points rules
const KTU_RULES: Record<string, Record<string, Record<string, number>>> = {
  'NSS/NCC/NSO': {
    'College': { 'Participant': 30, 'Leader': 50 },
    'University': { 'Participant': 40, 'Leader': 60 },
    'State': { 'Participant': 50, 'Leader': 70 },
    'National': { 'Participant': 60, 'Leader': 80 },
    'International': { 'Participant': 80, 'Leader': 100 },
  },
  'Sports': {
    'College': { 'Participant': 20, 'Winner': 30 },
    'University': { 'Participant': 30, 'Winner': 50 },
    'State': { 'Participant': 40, 'Winner': 60 },
    'National': { 'Participant': 50, 'Winner': 70 },
    'International': { 'Participant': 60, 'Winner': 80 },
  },
  'Arts': {
    'College': { 'Participant': 15, 'Winner': 25 },
    'University': { 'Participant': 25, 'Winner': 40 },
    'State': { 'Participant': 35, 'Winner': 50 },
    'National': { 'Participant': 45, 'Winner': 60 },
    'International': { 'Participant': 55, 'Winner': 70 },
  },
  'Professional Body': {
    'College': { 'Member': 15, 'Office Bearer': 30 },
    'University': { 'Member': 25, 'Office Bearer': 40 },
    'State': { 'Member': 35, 'Office Bearer': 50 },
    'National': { 'Member': 45, 'Office Bearer': 60 },
    'International': { 'Member': 55, 'Office Bearer': 70 },
  },
  'Entrepreneurship': {
    'College': { 'Participant': 20, 'Winner': 40 },
    'University': { 'Participant': 30, 'Winner': 50 },
    'State': { 'Participant': 40, 'Winner': 60 },
    'National': { 'Participant': 50, 'Winner': 70 },
    'International': { 'Participant': 60, 'Winner': 80 },
  },
  'Leadership': {
    'College': { 'Member': 20, 'Leader': 40 },
    'University': { 'Member': 30, 'Leader': 50 },
    'State': { 'Member': 40, 'Leader': 60 },
    'National': { 'Member': 50, 'Leader': 70 },
    'International': { 'Member': 60, 'Leader': 80 },
  },
  'MOOC': {
    'College': { 'Completed': 15 },
    'University': { 'Completed': 25 },
    'National': { 'Completed': 35 },
    'International': { 'Completed': 50 },
  },
}

export default function UploadCertificatePage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [suggestedPoints, setSuggestedPoints] = useState(0)
  const [form, setForm] = useState({
    title: '',
    activity_category: '',
    activity_level: '',
    activity_role: '',
    description: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)
    })
  }, [router])

  // Auto-calculate points when category/level/role changes
  useEffect(() => {
    const { activity_category, activity_level, activity_role } = form
    if (activity_category && activity_level && activity_role) {
      const pts = KTU_RULES[activity_category]?.[activity_level]?.[activity_role] ?? 0
      setSuggestedPoints(pts)
    } else {
      setSuggestedPoints(0)
    }
  }, [form.activity_category, form.activity_level, form.activity_role])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return }

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(path, file)

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('certificates').getPublicUrl(path)
    setFileUrl(data.publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.activity_category) { setError('Category is required'); return }
    if (!form.activity_level) { setError('Level is required'); return }
    if (!form.activity_role) { setError('Role is required'); return }
    if (!fileUrl) { setError('Please upload the certificate file'); return }

    setLoading(true)

    const { error: err } = await supabase.from('certificates').insert({
      profile_id: userId,
      title: form.title.trim(),
      activity_category: form.activity_category,
      activity_level: form.activity_level,
      activity_role: form.activity_role,
      description: form.description.trim() || null,
      file_url: fileUrl,
      suggested_points: suggestedPoints,
      status: 'pending',
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/certificates')
  }

  const categories = Object.keys(KTU_RULES)
  const levels = form.activity_category ? Object.keys(KTU_RULES[form.activity_category] ?? {}) : []
  const roles = form.activity_category && form.activity_level
    ? Object.keys(KTU_RULES[form.activity_category]?.[form.activity_level] ?? {})
    : []

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm transition block mb-6">← Back</button>
        <h1 className="text-2xl font-black text-white mb-1">Upload Certificate</h1>
        <p className="text-slate-400 text-sm mb-8">Submit for faculty review to earn KTU activity points</p>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-sm">Certificate Details</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Title <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. First Place - State Hackathon" value={form.title} onChange={set('title')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
              <textarea placeholder="Additional details about this achievement…" value={form.description} onChange={set('description')} rows={2}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>

          {/* KTU calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-white font-bold text-sm">KTU Points Calculator</h2>
              <p className="text-slate-500 text-xs mt-0.5">Select category, level, and your role to auto-calculate points</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Activity Category <span className="text-red-400">*</span></label>
              <select value={form.activity_category} onChange={e => {
                setForm(f => ({ ...f, activity_category: e.target.value, activity_level: '', activity_role: '' }))
              }}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Level <span className="text-red-400">*</span></label>
                <select value={form.activity_level} onChange={e => {
                  setForm(f => ({ ...f, activity_level: e.target.value, activity_role: '' }))
                }}
                  disabled={!form.activity_category}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40">
                  <option value="">Select level</option>
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Role <span className="text-red-400">*</span></label>
                <select value={form.activity_role} onChange={set('activity_role')}
                  disabled={!form.activity_level}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40">
                  <option value="">Select role</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Points preview */}
            {suggestedPoints > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest">Suggested Points</p>
                  <p className="text-white text-xs mt-0.5">Faculty may adjust during review</p>
                </div>
                <p className="text-blue-400 text-4xl font-black">{suggestedPoints}</p>
              </div>
            )}
          </div>

          {/* File upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-sm">Certificate File <span className="text-red-400">*</span></h2>
            <p className="text-slate-500 text-xs">PDF or image, max 5MB</p>

            {fileUrl ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-green-400 text-sm font-semibold">✓ File uploaded</p>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:underline">View file</a>
                </div>
                <button type="button" onClick={() => setFileUrl('')} className="text-red-400 text-xs hover:underline">Remove</button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition ${uploading ? 'border-blue-500/40 bg-blue-500/5' : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800'}`}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <p className="text-3xl mb-2">📎</p>
                    <p className="text-slate-300 text-sm font-semibold">Click to upload</p>
                    <p className="text-slate-500 text-xs mt-1">PDF, JPG, PNG up to 5MB</p>
                  </>
                )}
              </label>
            )}
          </div>

          <button type="submit" disabled={loading || uploading || !userId}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl py-4 text-sm transition">
            {loading ? 'Submitting…' : 'Submit for Review →'}
          </button>
        </form>
      </div>
    </div>
  )
}