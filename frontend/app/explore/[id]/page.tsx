'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabaseclient'

export default function CommunityProfile() {
  const { id } = useParams()
  const [community, setCommunity] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true)
      
      // 1. Fetch Community Details & Socials
      const { data: clubData } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single()
      
      // 2. Fetch all events for this community
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('community_id', id)
        .order('event_date', { ascending: false })

      setCommunity(clubData)
      setEvents(eventData || [])
      setLoading(false)
    }
    fetchProfileData()
  }, [id])

  if (loading) return <div className="p-10 text-center">Loading Profile...</div>
  if (!community) return <div className="p-10 text-center">Community not found.</div>

  const upcoming = events.filter(e => new Date(e.event_date) > new Date())
  const past = events.filter(e => new Date(e.event_date) <= new Date())

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">{community.name}</h1>
        <p className="text-blue-600 font-bold mt-2 uppercase tracking-widest text-sm">{community.type}</p>
        <p className="text-gray-500 mt-4 max-w-lg mx-auto">{community.description}</p>
        
        {/* Social Media Links */}
        <div className="flex justify-center space-x-4 mt-6">
          {community.instagram_url && (
            <a href={community.instagram_url} className="text-pink-600 font-bold hover:underline">Instagram</a>
          )}
          {community.linkedin_url && (
            <a href={community.linkedin_url} className="text-blue-700 font-bold hover:underline">LinkedIn</a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upcoming Programs Section */}
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center">
            🚀 Upcoming Programs
          </h3>
          <div className="space-y-4">
            {upcoming.length === 0 ? <p className="text-gray-400 italic">No future events scheduled.</p> : 
              upcoming.map(e => (
                <div key={e.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-bold">{e.event_name}</h4>
                  <p className="text-xs text-blue-600">{new Date(e.event_date).toLocaleDateString()}</p>
                </div>
            ))}
          </div>
        </section>

        {/* Past Programs Section */}
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center">
            📜 Past Programs
          </h3>
          <div className="space-y-4">
            {past.length === 0 ? <p className="text-gray-400 italic">No past records.</p> : 
              past.map(e => (
                <div key={e.id} className="p-4 bg-gray-50 rounded-xl grayscale opacity-70">
                  <h4 className="font-bold">{e.event_name}</h4>
                  <p className="text-xs text-gray-500">{new Date(e.event_date).toLocaleDateString()}</p>
                </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}