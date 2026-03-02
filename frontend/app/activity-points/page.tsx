'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ActivityPointsPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const uid = session.user.id

      const [summaryRes, recordsRes] = await Promise.all([
        supabase.from('activity_point_summary').select('*').eq('profile_id', uid).single(),
        supabase.from('certificates')
          .select('*')
          .eq('profile_id', uid)
          .eq('status', 'approved')
          .order('reviewed_at', { ascending: false }),
      ])

      setSummary(summaryRes.data ?? { total_points: 0, max_allowed: 100 })
      setRecords(recordsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const pct = Math.min(((summary?.total_points ?? 0) / (summary?.max_allowed ?? 100)) * 100, 100)

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-black text-white">Activity Points</h1>

        {/* Summary card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-slate-400 text-sm">Total Earned</p>
              <p className="text-5xl font-black text-blue-400 mt-1">
                {summary?.total_points ?? 0}
                <span className="text-xl font-normal text-slate-500">/{summary?.max_allowed ?? 100}</span>
              </p>
            </div>
            <p className="text-slate-500 text-sm">{pct.toFixed(0)}% complete</p>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            KTU requires 100 activity points for graduation
          </p>
        </div>

        {/* Approved certificates */}
        <div>
          <h2 className="text-white font-bold mb-3">Approved Certificates</h2>
          {records.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-3xl mb-2">🏆</p>
              <p className="text-sm">No approved certificates yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(cert => (
                <div key={cert.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{cert.title ?? 'Certificate'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {cert.activity_category} · {cert.activity_level}
                    </p>
                  </div>
                  <span className="text-green-400 font-black text-lg">+{cert.awarded_points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}