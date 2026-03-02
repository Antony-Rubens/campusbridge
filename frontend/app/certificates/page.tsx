'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CertificatesPage() {
  const router = useRouter()
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }

      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false })

      setCertificates(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/10 border-green-500/20 text-green-400',
    rejected: 'bg-red-500/10 border-red-500/20 text-red-400',
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">My Certificates</h1>
            <p className="text-slate-400 text-sm mt-1">{certificates.length} total submissions</p>
          </div>
          <button
            onClick={() => router.push('/certificates/upload')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
          >
            + Upload New
          </button>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-4xl mb-3">📄</p>
            <p className="font-semibold">No certificates yet</p>
            <p className="text-sm mt-1">Upload your first certificate to earn activity points</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-white font-bold">{cert.title ?? 'Certificate'}</h2>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                      {cert.activity_category && <span>📁 {cert.activity_category}</span>}
                      {cert.activity_level && <span>🎯 {cert.activity_level}</span>}
                      {cert.awarded_points > 0 && (
                        <span className="text-blue-400 font-bold">+{cert.awarded_points} pts</span>
                      )}
                      {cert.suggested_points > 0 && cert.status === 'pending' && (
                        <span className="text-slate-500">Suggested: {cert.suggested_points} pts</span>
                      )}
                    </div>
                    {cert.faculty_remarks && (
                      <p className="text-sm text-red-400 mt-2">Remarks: {cert.faculty_remarks}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex-shrink-0 ${STATUS_STYLES[cert.status] ?? STATUS_STYLES.pending}`}>
                    {cert.status ?? 'pending'}
                  </span>
                </div>
                {cert.file_url && (
                  <a
                    href={cert.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-3 inline-block"
                  >
                    📎 View Certificate
                  </a>
                )}
                <p className="text-xs text-slate-600 mt-2">
                  Submitted {new Date(cert.created_at).toDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}