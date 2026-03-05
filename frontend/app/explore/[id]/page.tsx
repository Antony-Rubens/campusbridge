'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function StudentProfile() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [profile, setProfile] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }
      const [profRes, sumRes, commRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('activity_point_summary').select('*').eq('profile_id', id).single(),
        supabase.from('community_members').select('communities(id,name,type)').eq('profile_id', id),
      ])
      if (!profRes.data) { router.push('/explore'); return }
      setProfile(profRes.data)
      setSummary(sumRes.data)
      setCommunities((commRes.data ?? []).map((m: any) => m.communities).filter(Boolean))
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) return <div className="page-loading"><div className="spinner"/></div>
  if (!profile) return null

  const pts = summary?.total_points ?? 0

  return (
    <div className="page-sm">
      <Link href="/explore" className="btn btn-ghost btn-sm" style={{ marginBottom:'20px', display:'inline-flex' }}>← Explore</Link>
      <div className="card fade-up" style={{ padding:'24px', marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px' }}>
          <div className="avatar" style={{ width:60, height:60, fontSize:22 }}>{profile.full_name?.[0] ?? '?'}</div>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>{profile.full_name}</h1>
            <p style={{ color:'var(--text2)', fontSize:'13px', margin:'0 0 6px' }}>{profile.department}{profile.semester ? ` · S${profile.semester}` : ''}{profile.batch ? ` · ${profile.batch}` : ''}</p>
            <span className="badge badge-gray" style={{ textTransform:'capitalize' }}>{profile.role?.replace('_',' ')}</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div style={{ background:'var(--surface2)', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
            <p style={{ fontSize:'28px', fontWeight:800, color:'var(--amber)', margin:'0 0 2px', lineHeight:1 }}>{pts}</p>
            <p style={{ color:'var(--text3)', fontSize:'11px', margin:0 }}>Activity Points</p>
          </div>
          <div style={{ background:'var(--surface2)', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
            <p style={{ fontSize:'28px', fontWeight:800, color:'var(--text)', margin:'0 0 2px', lineHeight:1 }}>{communities.length}</p>
            <p style={{ color:'var(--text3)', fontSize:'11px', margin:0 }}>Communities</p>
          </div>
        </div>
      </div>

      {profile.skills?.length > 0 && (
        <div className="card fade-up-1" style={{ padding:'18px', marginBottom:'12px' }}>
          <p style={{ color:'var(--text2)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 10px' }}>Skills</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {profile.skills.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
          </div>
        </div>
      )}

      {profile.interests?.length > 0 && (
        <div className="card fade-up-2" style={{ padding:'18px', marginBottom:'12px' }}>
          <p style={{ color:'var(--text2)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 10px' }}>Interests</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {profile.interests.map((i: string) => <span key={i} className="badge badge-gray">{i}</span>)}
          </div>
        </div>
      )}

      {(profile.github_link || profile.linkedin_id) && (
        <div className="card fade-up-3" style={{ padding:'18px', marginBottom:'12px', display:'flex', gap:'10px', flexWrap:'wrap' }}>
          {profile.github_link && <a href={profile.github_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">🐙 GitHub</a>}
          {profile.linkedin_id && <a href={`https://linkedin.com/in/${profile.linkedin_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">💼 LinkedIn</a>}
        </div>
      )}

      {communities.length > 0 && (
        <div className="card fade-up-3" style={{ padding:'18px' }}>
          <p style={{ color:'var(--text2)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 10px' }}>Communities</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {communities.map((c: any) => (
              <Link key={c.id} href={`/communities/${c.id}`} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px', background:'var(--surface2)', borderRadius:'8px', textDecoration:'none' }}>
                <div className="avatar" style={{ width:26, height:26, fontSize:10 }}>{c.name?.[0]}</div>
                <span style={{ fontSize:'13px', color:'var(--text)', fontWeight:500 }}>{c.name}</span>
                <span className={`badge ${c.type === 'class' ? 'badge-blue' : 'badge-gray'}`} style={{ marginLeft:'auto', fontSize:'10px' }}>{c.type}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}