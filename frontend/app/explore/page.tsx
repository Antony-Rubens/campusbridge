'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseclient'
import Link from 'next/link'

// IMPORTANT: This must be 'export default' to fix the error in your screenshot
export default function ExplorePage() {
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true)
      // Fetching all approved organizations per REQ-6
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('status', 'approved') 
      
      if (data) setCommunities(data)
      setLoading(false)
    }
    fetchCommunities()
  }, [])

  if (loading) return <div className="p-10 text-center">Loading Campus Directory...</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Explore Communities</h1>
        <p className="text-gray-500">Discover clubs, departments, and organizations at our college.</p>
      </div>

      {/* If no communities are found in your table editor (image_3a1f04.png) */}
      {communities.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-gray-400">No communities found. Add them in the database first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((club) => (
            <div key={club.id} className="group border border-gray-100 rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-all">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full">
                {club.type}
              </span>
              <h2 className="text-xl font-bold text-gray-800 mt-4 group-hover:text-blue-600">
                {club.name}
              </h2>
              <p className="text-gray-500 text-sm mt-3 line-clamp-2">
                {club.description || "Building the future of our campus."}
              </p>
              
              {/* Dynamic Link for Detailed View */}
              <Link 
                href={`/explore/${club.id}`} 
                className="mt-6 flex items-center text-sm font-bold text-blue-600"
              >
                View Further Details 
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}