'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ExplorePage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, department, semester, skills, role')
      .eq('is_profile_complete', true)
      .eq('role', 'student')
      .order('full_name')
      .then(({ data }) => {
        setStudents(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = students.filter(s =>
    !filter ||
    s.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.department?.toLowerCase().includes(filter.toLowerCase()) ||
    s.skills?.some((sk: string) => sk.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Explore Students</h1>
            <p className="text-slate-400 text-sm mt-1">{students.length} students on CampusBridge</p>
          </div>
          <input
            type="text"
            placeholder="Search by name, department, skill…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-72"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold">No students found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(student => (
              <Link
                key={student.id}
                href={`/explore/${student.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {student.full_name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm group-hover:text-blue-400 transition">
                      {student.full_name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {student.department} · Sem {student.semester}
                    </p>
                  </div>
                </div>
                {student.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills.slice(0, 3).map((s: string) => (
                      <span key={s} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {student.skills.length > 3 && (
                      <span className="text-xs text-slate-600">+{student.skills.length - 3}</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}