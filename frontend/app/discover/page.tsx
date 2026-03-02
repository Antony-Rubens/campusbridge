'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const COLORS: Record<string, string> = {
  'NSS/NCC/NSO': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Sports': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Arts': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Professional Body': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Entrepreneurship': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Leadership': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'MOOC': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
}

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    supabase
      .from('events')
      .select('*, communities(id, name, department)')
      .eq('is_published', true)
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        setEvents(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = events.filter(e =>
    !filter ||
    e.title?.toLowerCase().includes(filter.toLowerCase()) ||
    e.communities?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    e.ktu_category?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Discover Events</h1>
            <p className="text-slate-400 text-sm mt-1">{events.length} upcoming events</p>
          </div>
          <input
            type="text"
            placeholder="Search events…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-64"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(event => (
              <Link
                key={event.id}
                href={`/discover/${event.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 transition group"
              >
                {event.ktu_category && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${COLORS[event.ktu_category] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                    {event.ktu_category}
                  </span>
                )}
                <h2 className="text-white font-bold mt-3 group-hover:text-blue-400 transition line-clamp-2">
                  {event.title}
                </h2>
                <p className="text-slate-500 text-xs mt-1">by {event.communities?.name ?? 'Campus'}</p>
                <p className="text-slate-400 text-sm mt-2 line-clamp-2">{event.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    📅 {event.event_date ? new Date(event.event_date).toDateString() : 'TBD'}
                  </span>
                  {event.activity_points > 0 && (
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full">
                      +{event.activity_points} pts
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}