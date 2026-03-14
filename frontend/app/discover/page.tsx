'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, BANNER_GRADIENTS, BANNER_PATTERNS, KTU_CATEGORIES, type Event } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('events')
        .select('*, communities(name, banner_index, category)')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
      setEvents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = events.filter(e => {
    const matchSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.communities?.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || e.ktu_category === filterCategory
    return matchSearch && matchCat
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const levelColor = (level: string) => {
    const map: any = { college: 'badge-gray', university: 'badge-blue', national: 'badge-yellow', international: 'badge-purple' }
    return map[level] || 'badge-gray'
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Discover Events</h1>
          <p className="page-subtitle">All upcoming events across campus communities</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search events or communities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
          <select className="input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ maxWidth: '180px' }}>
            <option value="">All Categories</option>
            {KTU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(search || filterCategory) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterCategory('') }}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No events found</div>
            <div className="empty-desc">Try adjusting your search or filters</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {filtered.map(evt => {
              const bi = evt.banner_index ?? evt.communities?.banner_index ?? 0
              return (
                <Link key={evt.id} href={`/communities/${evt.community_id}/events/${evt.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                    {/* Banner */}
                    <div style={{
                      background: BANNER_GRADIENTS[bi % BANNER_GRADIENTS.length],
                      height: '90px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      position: 'relative',
                    }}>
                      {BANNER_PATTERNS[bi % BANNER_PATTERNS.length]}
                      <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                      }}>
                        <span className={`badge ${levelColor(evt.activity_level)}`} style={{ fontSize: '10px' }}>
                          {evt.activity_level}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', lineHeight: '1.3' }}>
                        {evt.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>
                        {evt.communities?.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                          📅 {formatDate(evt.event_date)}
                        </div>
                        <span className="badge badge-green">+{evt.suggested_points} pts</span>
                      </div>
                      {evt.ktu_category && (
                        <div style={{ marginTop: '8px' }}>
                          <span className="badge badge-blue" style={{ fontSize: '10px' }}>{evt.ktu_category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
          </div>
        )}
      </main>
    </div>
  )
}