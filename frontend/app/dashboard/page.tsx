'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [summary, setSummary] = useState<any>({ total_points: 0, max_allowed: 100 })
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const uid = session.user.id

      const [profileRes, summaryRes, certsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('activity_point_summary').select('*').eq('profile_id', uid).single(),
        supabase.from('certificates').select('*').eq('profile_id', uid).order('created_at', { ascending: false }).limit(5),
      ])

      setProfile(profileRes.data)
      if (summaryRes.data) setSummary(summaryRes.data)
      setCertificates(certsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return null

  const pct = Math.min(((summary.total_points ?? 0) / (summary.max_allowed ?? 100)) * 100, 100)
  const pending = certificates.filter(c => c.status === 'pending').length
  const approved = certificates.filter(c => c.status === 'approved').length

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-black text-white">
            Hey, {profile.full_name?.split(' ')[0] ?? 'Student'} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {profile.department} · Semester {profile.semester}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Activity Points</p>
            <p className="text-4xl font-black text-blue-400 mt-2">
              {summary.total_points ?? 0}
              <span className="text-lg font-normal text-slate-500">/{summary.max_allowed ?? 100}</span>
            </p>
            <div className="mt-3 h-1.5 bg-slate-800 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <Link href="/activity-points" className="text-xs text-blue-400 hover:underline mt-3 inline-block">
              View breakdown →
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pending Review</p>
            <p className="text-4xl font-black text-yellow-400 mt-2">{pending}</p>
            <p className="text-slate-500 text-sm mt-1">awaiting faculty</p>
            <Link href="/certificates" className="text-xs text-blue-400 hover:underline mt-3 inline-block">
              View all →
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Approved</p>
            <p className="text-4xl font-black text-green-400 mt-2">{approved}</p>
            <p className="text-slate-500 text-sm mt-1">certificates verified</p>
            <Link href="/certificates" className="text-xs text-blue-400 hover:underline mt-3 inline-block">
              View all →
            </Link>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-white font-bold">Your Profile</h2>
            <Link href="/register-details" className="text-xs text-blue-400 hover:underline">Edit</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Email', value: profile.email },
              { label: 'Department', value: profile.department || '—' },
              { label: 'Semester', value: profile.semester ? `Semester ${profile.semester}` : '—' },
              { label: 'Role', value: profile.role || 'student' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-slate-500 text-xs">{item.label}</p>
                <p className="text-white font-medium mt-0.5 capitalize">{item.value}</p>
              </div>
            ))}
          </div>
          {profile.skills?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((s: string) => (
                <span key={s} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/discover', icon: '🔍', label: 'Discover Events' },
            { href: '/certificates', icon: '📄', label: 'My Certificates' },
            { href: '/activity-points', icon: '🏆', label: 'Activity Points' },
            { href: '/explore', icon: '👥', label: 'Explore Students' },
          ].map(a => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 text-center transition group"
            >
              <div className="text-2xl mb-2">{a.icon}</div>
              <p className="text-xs font-semibold text-slate-400 group-hover:text-white transition">{a.label}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}