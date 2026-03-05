'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DiscoverPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const { data } = await supabase.from('events')
        .select('*, community:communities(name,type)')
        .eq('is_published', true)
        .eq('visibility', 'public')
        .order('event_date')
      setEvents(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = events.filter(ev => {
    if (!search) return true
    const q = search.toLowerCase()
    return ev.title?.toLowerCase().includes(q) || ev.community?.name?.toLowerCase().includes(q) || ev.ktu_category?.toLowerCase().includes(q)
  })

  const upcoming = filtered.filter(ev => ev.event_date && new Date(ev.event_date) >= new Date())
  const past = filtered.filter(ev => ev.event_date && new Date(ev.event_date) < new Date())

  const EventCard = ({ ev }: { ev: any }) => (
    <div className="card card-hover" style={{ padding:'18px', display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:'6px', marginBottom:'8px', flexWrap:'wrap' }}>
            {ev.community?.name && <span className="badge badge-gray">{ev.community.name}</span>}
            {ev.ktu_category && <span className="badge badge-blue">{ev.ktu_category}</span>}
          </div>
          <p style={{ fontWeight:700, color:'var(--text)', fontSize:'15px', margin:'0 0 4px' }}>{ev.title}</p>
          {ev.description && <p style={{ color:'var(--text2)', fontSize:'12px', margin:'0 0 6px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{ev.description}</p>}
        </div>
        {ev.activity_points > 0 && <span className="badge badge-amber" style={{ flexShrink:0 }}>+{ev.activity_points} pts</span>}
      </div>
      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
        {ev.event_date && <span style={{ color:'var(--text3)', fontSize:'12px' }}>📅 {new Date(ev.event_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>}
        {ev.location && <span style={{ color:'var(--text3)', fontSize:'12px' }}>📍 {ev.location}</span>}
        {ev.max_participants && <span style={{ color:'var(--text3)', fontSize:'12px' }}>👥 Max {ev.max_participants}</span>}
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="fade-up" style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Discover Events</h1>
        <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>{events.length} events on campus</p>
      </div>
      <div className="fade-up-1" style={{ marginBottom:'20px' }}>
        <input className="input" placeholder="Search events, communities, categories…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:'360px' }} />
      </div>
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {[...Array(4)].map((_,i) => <div key={i} className="card" style={{ height:'100px', opacity:.4 }} />)}
        </div>
      ) : (
        <div className="fade-up-2" style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize:'14px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 12px' }}>Upcoming ({upcoming.length})</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>{upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize:'14px', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 12px' }}>Past Events ({past.length})</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', opacity:.6 }}>{past.map(ev => <EventCard key={ev.id} ev={ev} />)}</div>
            </div>
          )}
          {filtered.length === 0 && <div className="empty-state"><div className="icon">🔍</div><p>No events found</p></div>}
        </div>
      )}
    </div>
  )
}