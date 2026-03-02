'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseclient'

export default function FacultyPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const token = session.access_token
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

      try {
        // Check role first
        const profileRes = await fetch(`${BACKEND}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const profileData = await profileRes.json()

        if (!['faculty', 'system_admin'].includes(profileData.role)) {
          router.push('/dashboard')
          return
        }

        // Fetch pending submissions
        const res = await fetch(`${BACKEND}/api/activity-points/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setSubmissions(data)
      } catch (err) {
        console.error('Failed to load submissions:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

      const res = await fetch(`${BACKEND}/api/activity-points/${id}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          awarded_points: overrides[id] || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to process')
      }

      // Remove from pending list
      setSubmissions(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      alert(err.message || 'Something went wrong')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading submissions...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Faculty Panel</h1>
        <p className="text-gray-500 mt-1">
          Review and approve student activity point submissions
        </p>
      </div>

      {/* Count */}
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6 inline-block">
        <p className="text-sm text-gray-500">
          Pending submissions:
          <span className="ml-2 font-bold text-yellow-500 text-lg">
            {submissions.length}
          </span>
        </p>
      </div>

      {/* Submissions */}
      {submissions.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-gray-400 text-lg">No pending submissions.</p>
          <p className="text-gray-300 text-sm mt-1">
            All caught up! Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border rounded-2xl p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Student Info */}
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Student
                  </p>
                  <p className="font-bold text-gray-800">{sub.full_name}</p>
                  <p className="text-sm text-gray-500">{sub.email}</p>
                  <p className="text-sm text-gray-500">
                    {sub.department} {sub.roll_number && `· ${sub.roll_number}`}
                  </p>
                </div>

                {/* Certificate Info */}
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Certificate
                  </p>
                  <p className="font-bold text-gray-800">{sub.certificate_name}</p>
                  <p className="text-sm text-gray-500">
                    {sub.category} / {sub.level} / {sub.role}
                  </p>
                  <p className="text-sm font-semibold text-blue-600">
                    Rule points: {sub.rule_points}
                  </p>
                  {sub.file_url && (
                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                    >
                      View Certificate →
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 font-medium">
                    Override points:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder={String(sub.rule_points)}
                    className="w-20 p-2 border rounded-lg text-sm text-center"
                    value={overrides[sub.id] || ''}
                    onChange={(e) => setOverrides(prev => ({
                      ...prev,
                      [sub.id]: parseInt(e.target.value)
                    }))}
                  />
                </div>

                <button
                  onClick={() => handleDecision(sub.id, 'approved')}
                  disabled={processing === sub.id}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50"
                >
                  {processing === sub.id ? 'Processing...' : '✓ Approve'}
                </button>

                <button
                  onClick={() => handleDecision(sub.id, 'rejected')}
                  disabled={processing === sub.id}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
                >
                  {processing === sub.id ? 'Processing...' : '✗ Reject'}
                </button>

                <p className="text-xs text-gray-400">
                  Submitted {new Date(sub.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}