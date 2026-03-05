'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const HIDDEN = ['/', '/register-details', '/auth/handle-callback']

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) load(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null)
      if (s?.user) load(s.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const load = async (id: string) => {
    const { data } = await supabase.from('profiles').select('full_name,role').eq('id', id).single()
    setProfile(data)
  }

  if (!user || HIDDEN.includes(pathname)) return null

  const isAdmin = profile?.role === 'system_admin'
  const isFaculty = profile?.role === 'faculty' || isAdmin

  const L = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link href={href} style={{ fontSize:'13px', fontWeight: active ? 600 : 500, color: active ? 'var(--amber)' : 'var(--text2)', textDecoration:'none', transition:'color .15s', paddingBottom:'2px', borderBottom: active ? '1px solid var(--amber)' : '1px solid transparent' }}>
        {label}
      </Link>
    )
  }

  return (
    <nav style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 24px', height:'54px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'28px' }}>
          <Link href="/dashboard" style={{ fontWeight:800, fontSize:'15px', color:'var(--text)', textDecoration:'none', letterSpacing:'-0.3px', flexShrink:0 }}>
            Campus<span style={{ color:'var(--amber)' }}>Bridge</span>
          </Link>
          <div style={{ display:'flex', gap:'18px', alignItems:'center', flexWrap:'wrap' }}>
            <L href="/dashboard" label="Dashboard" />
            <L href="/discover" label="Discover" />
            <L href="/communities" label="Communities" />
            <L href="/certificates" label="Certificates" />
            <L href="/activity-points" label="Points" />
            <L href="/explore" label="Explore" />
            <L href="/profile" label="Profile" />
            {isFaculty && <L href="/faculty" label="Faculty" />}
            {isAdmin && <L href="/admin" label="Admin" />}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
          {profile && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', lineHeight:1.2 }}>{profile.full_name}</div>
              <div style={{ fontSize:'10px', color:'var(--text3)', textTransform:'capitalize' }}>{profile.role?.replace('_',' ')}</div>
            </div>
          )}
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="btn btn-ghost btn-sm">Sign out</button>
        </div>
      </div>
    </nav>
  )
}