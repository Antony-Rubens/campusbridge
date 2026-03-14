'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, ALL_SKILLS, SKILLS_LIST } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function ScoutPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  useEffect(() => {
    if (!id || id === 'undefined') {
      router.push('/communities')
    }
  }, [id])

  const [community, setCommunity] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Filters
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [message, setMessage] = useState('')

  // Invite state
  const [inviting, setInviting] = useState<string | null>(null)
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: comm } = await supabase.from('communities').select('*').eq('id', id).single()
      setCommunity(comm)

      const { data: evts } = await supabase.from('events').select('id, title')
        .eq('community_id', id).gte('event_date', new Date().toISOString())
      setEvents(evts || [])

      // Already invited
      const { data: existing } = await supabase.from('scout_invites')
        .select('invited_profile_id').eq('community_id', id).eq('invited_by', user.id)
      setInvitedIds(new Set(existing?.map(e => e.invited_profile_id) || []))
    }
    load()
  }, [id])

  const toggleSkill = (s: string) => {
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const handleSearch = async () => {
    if (selectedSkills.length === 0) return
    setLoading(true)
    setSearched(true)

    // Get current community members to exclude them
    const { data: existingMembers } = await supabase
      .from('community_members')
      .select('profile_id')
      .eq('community_id', id)

    const memberIds = existingMembers?.map(m => m.profile_id) || []

    const { data: allStudents } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, semester, skills, interests, departments(name)')
      .eq('role', 'student')
      .eq('is_profile_complete', true)
      .overlaps('skills', selectedSkills)

    // Filter out existing members (including self)
    const data = allStudents?.filter(s => !memberIds.includes(s.id)) || []

    setStudents(data || [])
    setLoading(false)
  }

  const handleInvite = async (studentId: string) => {
    setInviting(studentId)
    const { error } = await supabase.from('scout_invites').insert({
      community_id: id,
      event_id: selectedEvent || null,
      invited_by: userId,
      invited_profile_id: studentId,
      message: message.trim() || null,
      status: 'pending',
    })
    if (!error) {
      // Create notification
      await supabase.from('notifications').insert({
        profile_id: studentId,
        type: 'scout_invite',
        title: `${community?.name} wants you!`,
        body: message.trim() || `You've been scouted by ${community?.name}. Check your invites.`,
        is_read: false,
        related_id: id,
      })
      setInvitedIds(prev => new Set([...prev, studentId]))
    }
    setInviting(null)
  }

  const matchingSkills = (studentSkills: string[]) =>
    selectedSkills.filter(s => studentSkills?.includes(s))

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Scout Members</h1>
            <p className="page-subtitle">{community?.name} · Find students by skill</p>
          </div>
          <Link href={`/communities/${id}/manage`} className="btn btn-ghost">← Back</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          {/* Filter panel */}
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Filter by Skills
              </div>
              {Object.entries(SKILLS_LIST).map(([cat, skills]) => (
                <div key={cat} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', fontWeight: '600' }}>{cat}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {skills.map((s: string) => (
                      <button key={s} onClick={() => toggleSkill(s)} style={{
                        padding: '3px 10px', borderRadius: '99px', fontSize: '11px', cursor: 'pointer',
                        fontFamily: 'Sora, sans-serif',
                        border: `1px solid ${selectedSkills.includes(s) ? '#4f8ef740' : 'var(--border)'}`,
                        background: selectedSkills.includes(s) ? 'var(--accent-glow)' : 'transparent',
                        color: selectedSkills.includes(s) ? 'var(--accent)' : 'var(--text-3)',
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Invite For Event
              </div>
              <select className="input" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                <option value="">General invite</option>
                {events.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
              </select>
              <div style={{ marginTop: '10px' }}>
                <label className="input-label">Custom Message (optional)</label>
                <textarea className="input" placeholder="Why are you reaching out?" value={message} onChange={e => setMessage(e.target.value)} style={{ minHeight: '70px' }} />
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={selectedSkills.length === 0 || loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Searching...</> : `Search (${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''})`}
            </button>
          </div>

          {/* Results */}
          <div>
            {!searched ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">Select skills to search</div>
                <div className="empty-desc">Pick skills from the left panel to find matching students</div>
              </div>
            ) : loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius)' }} />)}
              </div>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <div className="empty-title">No matching students found</div>
                <div className="empty-desc">Try different skill filters</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>
                  {students.length} student{students.length !== 1 ? 's' : ''} found
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {students.map(s => {
                    const matching = matchingSkills(s.skills || [])
                    const alreadyInvited = invitedIds.has(s.id)
                    return (
                      <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'var(--accent-glow)', color: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '15px', fontWeight: '700', flexShrink: 0,
                        }}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{s.full_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '6px' }}>
                            {s.departments?.name} · S{s.semester}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>
                            📧 {s.email}{s.phone ? ` · 📞 ${s.phone}` : ''}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {matching.map(skill => (
                              <span key={skill} className="badge badge-green" style={{ fontSize: '10px' }}>✓ {skill}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          className={`btn btn-sm ${alreadyInvited ? 'btn-ghost' : 'btn-primary'}`}
                          disabled={alreadyInvited || inviting === s.id}
                          onClick={() => handleInvite(s.id)}
                          style={{ flexShrink: 0 }}
                        >
                          {inviting === s.id ? '...' : alreadyInvited ? '✓ Invited' : 'Invite'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}