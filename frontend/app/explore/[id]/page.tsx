'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseclient'
import { fetchEvent } from '../../../lib/api'

export default function CommunityDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [community, setCommunity] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch community details
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single()

        if (communityError) throw communityError

        // 2. Fetch events for this community (published only)
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('community_id', id)
          .eq('status', 'published')
          .order('event_date', { ascending: false })

        if (eventError) throw eventError

        setCommunity(communityData)
        setEvents(eventData || [])
      } catch (err: any) {
        console.error('Failed to load community:', err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading community...</p>
    </div>
  )

  if (!community) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 text-lg">Community not found.</p>
        <button
          onClick={() => router.push('/explore')}
          className="mt-4 text-blue-500 hover:underline text-sm"
        >
          ← Back to Explore
        </button>
      </div>
    </div>
  )

  const upcoming = events.filter(e => new Date(e.event_date) > new Date())
  const past = events.filter(e => new Date(e.event_date) <= new Date())

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-500 hover:underline mb-6 inline-block"
      >
        ← Back
      </button>

      {/* Community Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border mb-8 text-center">
        {/* Type + Department badges */}
        <div className="flex justify-center gap-2 mb-4">
          {community.type && (
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase rounded-full border border-blue-200">
              {community.type}
            </span>
          )}
          {community.department && (
            <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border">
              {community.department}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900">
          {community.name}
        </h1>

        <p className="text-gray-500 mt-4 max-w-lg mx-auto text-sm leading-relaxed">
          {community.description || 'No description provided.'}
        </p>

        <p className="text-xs text-gray-300 mt-4">
          Community since {new Date(community.created_at).getFullYear()}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{events.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Events</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-500">{upcoming.length}</p>
          <p className="text-xs text-gray-400 mt-1">Upcoming</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-400">{past.length}</p>
          <p className="text-xs text-gray-400 mt-1">Past Events</p>
        </div>
      </div>

      {/* Events Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Upcoming Events */}
        <section>
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            🚀 Upcoming Events
          </h3>
          <div className="space-y-3">
            {upcoming.length === 0
              ? <p className="text-gray-400 italic text-sm">No upcoming events scheduled.</p>
              : upcoming.map(e => (
                <div
                  key={e.id}
                  onClick={() => router.push(`/discover`)}
                  className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 cursor-pointer transition"
                >
                  {e.category && (
                    <span className="text-xs font-semibold text-blue-500 uppercase">
                      {e.category}
                    </span>
                  )}
                  <h4 className="font-bold text-gray-800 mt-1">{e.title}</h4>
                  <p className="text-xs text-blue-600 mt-1">
                    📅 {new Date(e.event_date).toLocaleDateString()}
                  </p>
                  {e.location && (
                    <p className="text-xs text-gray-400 mt-1">
                      📍 {e.location}
                    </p>
                  )}
                </div>
              ))
            }
          </div>
        </section>

        {/* Past Events */}
        <section>
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            📜 Past Events
          </h3>
          <div className="space-y-3">
            {past.length === 0
              ? <p className="text-gray-400 italic text-sm">No past events on record.</p>
              : past.map(e => (
                <div
                  key={e.id}
                  className="p-4 bg-gray-50 rounded-xl border opacity-70"
                >
                  {e.category && (
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {e.category}
                    </span>
                  )}
                  <h4 className="font-bold text-gray-600 mt-1">{e.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    📅 {new Date(e.event_date).toLocaleDateString()}
                  </p>
                  {e.location && (
                    <p className="text-xs text-gray-300 mt-1">
                      📍 {e.location}
                    </p>
                  )}
                </div>
              ))
            }
          </div>
        </section>

      </div>
    </div>
  )
}