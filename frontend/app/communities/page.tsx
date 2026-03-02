'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORY_COLORS: Record<string, string> = {
  'Technical': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Cultural': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Sports': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Social': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Professional': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export default function CommunitiesPage() {
  const router = useRouter()
  const [communities, setCommunities] = useState<any[]>([])
  const [myIds, setMyIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)

      const [commRes, memberRes] = await Promise.all([
        supabase
          .from('communities')
          .select('*, creator:profiles!communities_created_by_fkey(full_name)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('community_members')
          .select('community_id')
          .eq('profile_id', session.user.id),
      ])

      setCommunities(commRes.data ?? [])
      setMyIds(new Set((memberRes.data ?? []).map((m: any) => m.community_id)))
      setLoading(false)
    }
    load()
  }, [router])

  const handleJoin = async (communityId: string) => {
    const { error } = await supabase.from('community_members').insert({ community_id: communityId, profile_id: userId })
    if (!error) setMyIds(prev => new Set([...prev, communityId]))
  }

  const handleLeave = async (communityId: string) => {
    await supabase.from('community_members').delete().eq('community_id', communityId).eq('profile_id', userId)
    setMyIds(prev => { const s = new Set(prev); s.delete(communityId); return s })
  }

  const filtered = communities.filter(c =>
    !filter ||
    c.name?.toLowerCase().includes(filter.toLowerCase()) ||
    c.category?.toLowerCase().includes(filter.toLowerCase()) ||
    c.department?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Communities</h1>
            <p className="text-slate-400 text-sm mt-1">{communities.length} active communities</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 w-48"
            />
            <Link href="/communities/create" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition whitespace-nowrap">
              + Create
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-4xl mb-3">🏘️</p>
            <p className="font-semibold">No communities yet</p>
            <Link href="/communities/create" className="text-blue-400 text-sm hover:underline mt-2 inline-block">Create the first one →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const isMember = myIds.has(c.id)
              const isOwner = c.created_by === userId
              return (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {c.category && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[c.category] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                          {c.category}
                        </span>
                      )}
                      <h2 className="text-white font-bold mt-2 text-sm">{c.name}</h2>
                      {c.department && <p className="text-slate-500 text-xs">{c.department}</p>}
                    </div>
                    {isOwner && (
                      <Link href={`/communities/${c.id}/manage`} className="text-slate-500 hover:text-white text-lg transition">⚙️</Link>
                    )}
                  </div>
                  {c.description && <p className="text-slate-400 text-xs line-clamp-2">{c.description}</p>}
                  {c.creator?.full_name && <p className="text-slate-600 text-xs">👤 {c.creator.full_name}</p>}
                  <div className="flex gap-2 mt-auto pt-1">
                    <Link href={`/communities/${c.id}`} className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 rounded-lg transition">
                      View
                    </Link>
                    {!isOwner && (
                      <button
                        onClick={() => isMember ? handleLeave(c.id) : handleJoin(c.id)}
                        className={`flex-1 text-xs font-semibold py-2 rounded-lg transition ${isMember ? 'bg-slate-700 hover:bg-red-900/30 text-slate-300 hover:text-red-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                      >
                        {isMember ? 'Leave' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}