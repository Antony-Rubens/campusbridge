'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function CommunityPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [community, setCommunity] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [userRole, setUserRole] = useState<string|null>(null)
  const [isMember, setIsMember] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [facultyReqs, setFacultyReqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reqMsg, setReqMsg] = useState('')
  const [showReqForm, setShowReqForm] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      setUserId(session.user.id)

      const [commRes, profRes] = await Promise.all([
        supabase.from('communities').select('*, creator:profiles!communities_created_by_fk(full_name,id)').eq('id', id).single(),
        supabase.from('profiles').select('role,full_name').eq('id', session.user.id).single(),
      ])
      if (!commRes.data) { router.push('/communities'); return }
      setCommunity(commRes.data)
      setProfile(profRes.data)

      const [memRes, evRes, myMemRes] = await Promise.all([
        supabase.from('community_members').select('*, profile:profiles(full_name,department,semester,role)').eq('community_id', id),
        supabase.from('events').select('*').eq('community_id', id).eq('is_published', true).order('event_date'),
        supabase.from('community_members').select('role').eq('community_id', id).eq('profile_id', session.user.id).single(),
      ])
      setMembers(memRes.data ?? [])
      setEvents(evRes.data ?? [])
      if (myMemRes.data) { setIsMember(true); setUserRole(myMemRes.data.role) }

      if (commRes.data.created_by === session.user.id) {
        const { data: reqs } = await supabase.from('faculty_coordinator_requests')
          .select('*, faculty:profiles!faculty_coordinator_requests_faculty_id_fkey(full_name,department)')
          .eq('community_id', id).eq('status', 'pending')
        setFacultyReqs(reqs ?? [])
      }
      setLoading(false)
    }
    load()
  }, [id, router])

  const join = async () => {
    await supabase.from('community_members').insert({ community_id: id, profile_id: userId })
    setIsMember(true); setUserRole('member')
  }
  const leave = async () => {
    await supabase.from('community_members').delete().eq('community_id', id).eq('profile_id', userId)
    setIsMember(false); setUserRole(null)
  }
  const sendFacultyReq = async () => {
    await supabase.from('faculty_coordinator_requests').insert({ community_id: id, faculty_id: userId, message: reqMsg })
    setShowReqForm(false); setReqMsg('')
  }
  const approveReq = async (reqId: string, facultyId: string) => {
    await supabase.from('faculty_coordinator_requests').update({ status:'approved', reviewed_by:userId }).eq('id', reqId)
    await supabase.from('communities').update({ faculty_coordinator: facultyId }).eq('id', id)
    setFacultyReqs(p => p.filter(r => r.id !== reqId))
  }
  const rejectReq = async (reqId: string) => {
    await supabase.from('faculty_coordinator_requests').update({ status:'rejected', reviewed_by:userId }).eq('id', reqId)
    setFacultyReqs(p => p.filter(r => r.id !== reqId))
  }

  if (loading) return <div className="page-loading"><div className="spinner"/></div>
  if (!community) return null

  const isOwner = community.created_by === userId
  const isAdmin = isOwner || userRole === 'admin'
  const isFaculty = profile?.role === 'faculty' || profile?.role === 'system_admin'

  return (
    <div className="page">
      {/* Header */}
      <div className="fade-up" style={{ marginBottom:'24px' }}>
        <Link href="/communities" className="btn btn-ghost btn-sm" style={{ marginBottom:'14px', display:'inline-flex' }}>← Communities</Link>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
              <span className={`badge ${community.type === 'class' ? 'badge-blue' : 'badge-gray'}`}>{community.type}</span>
              {community.category && <span className="badge badge-amber">{community.category}</span>}
              {isMember && <span className="badge badge-green">Joined</span>}
            </div>
            <h1 style={{ fontSize:'24px', fontWeight:800, color:'var(--text)', margin:'0 0 4px', letterSpacing:'-0.4px' }}>{community.name}</h1>
            {community.department && <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>{community.department}{community.semester ? ` · S${community.semester}` : ''}</p>}
            {community.description && <p style={{ color:'var(--text2)', fontSize:'14px', margin:'10px 0 0', maxWidth:'600px' }}>{community.description}</p>}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {isAdmin && <Link href={`/communities/${id}/manage`} className="btn btn-secondary btn-sm">⚙ Manage</Link>}
            {isAdmin && <Link href={`/communities/${id}/events/create`} className="btn btn-primary btn-sm">+ Event</Link>}
            {!isOwner && (
              <button onClick={isMember ? leave : join} className={`btn btn-sm ${isMember ? 'btn-danger' : 'btn-primary'}`}>
                {isMember ? 'Leave' : 'Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Faculty coordinator requests (owner only) */}
      {isOwner && facultyReqs.length > 0 && (
        <div className="card fade-up-1" style={{ padding:'16px', marginBottom:'20px', borderColor:'rgba(245,158,11,0.3)' }}>
          <p style={{ fontWeight:700, color:'var(--text)', fontSize:'13px', margin:'0 0 12px' }}>Faculty Coordinator Requests ({facultyReqs.length})</p>
          {facultyReqs.map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px', background:'var(--surface2)', borderRadius:'10px', marginBottom:'8px', gap:'12px' }}>
              <div>
                <p style={{ fontWeight:600, color:'var(--text)', fontSize:'13px', margin:'0 0 2px' }}>{r.faculty?.full_name}</p>
                <p style={{ color:'var(--text3)', fontSize:'12px', margin:0 }}>{r.faculty?.department}{r.message ? ` · "${r.message}"` : ''}</p>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => approveReq(r.id, r.faculty_id)} className="btn btn-sm" style={{ background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(16,185,129,.2)' }}>Approve</button>
                <button onClick={() => rejectReq(r.id)} className="btn btn-danger btn-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Faculty coordinator request button */}
      {isFaculty && !community.faculty_coordinator && !isOwner && (
        <div className="card fade-up-1" style={{ padding:'16px', marginBottom:'20px', borderColor:'var(--amber-border)' }}>
          <p style={{ fontWeight:700, color:'var(--text)', fontSize:'13px', margin:'0 0 4px' }}>Become Faculty Coordinator</p>
          <p style={{ color:'var(--text2)', fontSize:'12px', margin:'0 0 10px' }}>Request to coordinate this community</p>
          {showReqForm ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <textarea className="input" placeholder="Why do you want to coordinate?" value={reqMsg} onChange={e => setReqMsg(e.target.value)} rows={2} style={{ resize:'none' }} />
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={sendFacultyReq} className="btn btn-primary btn-sm">Send Request</button>
                <button onClick={() => setShowReqForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowReqForm(true)} className="btn btn-secondary btn-sm">Request Coordinator Role</button>
          )}
        </div>
      )}

      <div className="fade-up-2" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'20px', alignItems:'start' }}>
        {/* Events */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <h2 className="section-title">Events</h2>
            {isAdmin && <Link href={`/communities/${id}/events/create`} className="btn btn-primary btn-sm">+ Add Event</Link>}
          </div>
          {events.length === 0 ? (
            <div className="card" style={{ padding:'40px', textAlign:'center' }}>
              <p style={{ fontSize:'28px', margin:'0 0 8px' }}>📅</p>
              <p style={{ color:'var(--text2)', fontSize:'13px', margin:0 }}>No events yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {events.map(ev => (
                <div key={ev.id} className="card" style={{ padding:'16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px' }}>
                  <div>
                    <p style={{ fontWeight:600, color:'var(--text)', fontSize:'14px', margin:'0 0 4px' }}>{ev.title}</p>
                    <p style={{ color:'var(--text3)', fontSize:'12px', margin:'0 0 4px' }}>{ev.location || 'TBD'}</p>
                    <p style={{ color:'var(--text2)', fontSize:'12px', margin:0 }}>
                      📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'TBD'}
                    </p>
                  </div>
                  {ev.activity_points > 0 && <span className="badge badge-amber">+{ev.activity_points} pts</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div>
          <h2 className="section-title" style={{ marginBottom:'14px' }}>Members ({members.length})</h2>
          <div className="card" style={{ padding:'12px', maxHeight:'400px', overflowY:'auto' }}>
            {members.map(m => (
              <div key={m.profile_id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 4px', borderBottom:'1px solid var(--border)' }}>
                <div className="avatar" style={{ width:32, height:32, fontSize:12 }}>{m.profile?.full_name?.[0] ?? '?'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, color:'var(--text)', fontSize:'12px', margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.profile?.full_name}</p>
                  <p style={{ color:'var(--text3)', fontSize:'11px', margin:0 }}>{m.profile?.department}{m.profile?.semester ? ` S${m.profile.semester}` : ''}</p>
                </div>
                {m.role !== 'member' && <span className="badge badge-amber" style={{ fontSize:'10px' }}>{m.role}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}