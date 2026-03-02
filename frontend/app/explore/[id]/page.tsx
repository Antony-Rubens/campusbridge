'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function StudentProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [profile, setProfile] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const [profileRes, summaryRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('activity_point_summary').select('*').eq('profile_id', id).single(),
      ])
      if (!profileRes.data) { router.push('/explore'); return }
      setProfile(profileRes.data)
      setSummary(summaryRes.data)
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return null

  const pct = Math.min(((summary?.total_points ?? 0) / (summary?.max_allowed ?? 100)) * 100, 100)

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link href="/explore" className="text-slate-400 hover:text-white text-sm transition">
          ← Back to Explore
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
              {profile.full_name?.[0] ?? '?'}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{profile.full_name}</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {profile.department} · Semester {profile.semester}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            {profile.github_link && (
              <a href={profile.github_link} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:underline">
                🐙 GitHub
              </a>
            )}
            {profile.linkedin_id && (
              <a href={`https://linkedin.com/in/${profile.linkedin_id}`} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:underline">
                💼 LinkedIn
              </a>
            )}
          </div>

          {summary && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Activity Points</span>
                <span className="text-blue-400 font-bold">{summary.total_points}/{summary.max_allowed}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {profile.skills?.length > 0 && (
            <div className="mb-4">
              <p className="text-slate-500 text-xs mb-2 uppercase tracking-widest">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string) => (
                  <span key={s} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs mb-2 uppercase tracking-widest">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((s: string) => (
                  <span key={s} className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}