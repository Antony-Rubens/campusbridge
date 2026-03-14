'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, BANNER_GRADIENTS, BANNER_PATTERNS } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function EventDetailPage() {
  const { id, eventId } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [community, setCommunity] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [regCount, setRegCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: evt } = await supabase
        .from('events')
        .select('*, creator:created_by(full_name)')
        .eq('id', eventId)
        .single()
      setEvent(evt)

      const { data: comm } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single()
      setCommunity(comm)

      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
      setRegCount(count || 0)

      const { data: myReg } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('event_id', eventId)
        .eq('profile_id', user.id)
        .single()
      setIsRegistered(!!myReg)

      setLoading(false)
    }
    load()
  }, [eventId, id])

  const handleRegister = async () => {
    setRegistering(true)
    if (isRegistered) {
      await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('profile_id', userId)
      setIsRegistered(false)
      setRegCount(p => p - 1)
    } else {
      await supabase.from('event_registrations').insert({ event_id: eventId, profile_id: userId })
      setIsRegistered(true)
      setRegCount(p => p + 1)
    }
    setRegistering(false)
  }

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></main>
    </div>
  )
  if (!event) return null

  const bi = event.banner_index ?? 0
  const isPast = new Date(event.event_date) < new Date()
  const isFull = event.max_participants && regCount >= event.max_participants

  const levelColor: any = { college: 'badge-gray', university: 'badge-blue', national: 'badge-yellow', international: 'badge-purple' }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>
        {/* Banner */}
        <div style={{
          background: BANNER_GRADIENTS[bi % BANNER_GRADIENTS.length],
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          position: 'relative',
        }}>
          <span style={{ opacity: 0.3 }}>{BANNER_PATTERNS[bi % BANNER_PATTERNS.length]}</span>
          <div style={{ position: 'absolute', bottom: '16px', left: '32px', right: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {event.ktu_category && <span className="badge badge-blue" style={{ fontSize: '10px' }}>{event.ktu_category}</span>}
                {event.activity_level && <span className={`badge ${levelColor[event.activity_level]}`} style={{ fontSize: '10px' }}>{event.activity_level}</span>}
                {isPast && <span className="badge badge-gray" style={{ fontSize: '10px' }}>Past Event</span>}
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{event.title}</h1>
            </div>
            <span className="badge badge-green" style={{ fontSize: '13px', padding: '6px 14px' }}>+{event.suggested_points} pts</span>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            {/* Main content */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Link href={`/communities/${id}`} style={{ fontSize: '13px', color: 'var(--accent)' }}>
                  ← {community?.name}
                </Link>
              </div>

              {event.description && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.7' }}>{event.description}</p>
                </div>
              )}

              <div className="card">
                <h3 style={{ marginBottom: '14px', fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KTU Activity Points</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Points Offered</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--green)' }}>+{event.suggested_points}</div>
                  </div>
                  {event.ktu_category && <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Category</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{event.ktu_category}</div>
                  </div>}
                  {event.activity_level && <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Level</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{event.activity_level}</div>
                  </div>}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '12px' }}>
                  After participating, upload your certificate on the Certificates page to claim these points.
                </p>
              </div>
            </div>

            {/* Sidebar card */}
            <div>
              <div className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Date & Time</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {event.venue && <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Venue</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>📍 {event.venue}</div>
                  </div>}

                  {event.registration_deadline && <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Register By</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {new Date(event.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>}

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Registrations</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {regCount}{event.max_participants ? ` / ${event.max_participants}` : ''} registered
                    </div>
                  </div>

                  <div className="divider" style={{ margin: '4px 0' }} />

                  {!isPast && (
                    <button
                      className={`btn ${isRegistered ? 'btn-ghost' : 'btn-primary'}`}
                      onClick={handleRegister}
                      disabled={registering || (!isRegistered && !!isFull)}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {registering ? '...' : isRegistered ? '✓ Registered (click to cancel)' : isFull ? 'Event Full' : 'Register Interest'}
                    </button>
                  )}

                  <Link href="/certificates/upload" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                    Upload Certificate →
                  </Link>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center' }}>
                Organised by {event.creator?.full_name || community?.name}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}