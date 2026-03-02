'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const HIDDEN_ON = ['/', '/register-details', '/auth/handle-callback']

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (id: string) => {
    const { data } = await supabase.from('profiles').select('full_name, role').eq('id', id).single()
    setProfile(data)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user || HIDDEN_ON.includes(pathname)) return null

  const isAdmin = profile?.role === 'system_admin'
  const isFaculty = profile?.role === 'faculty' || isAdmin

  const link = (href: string, label: string) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`text-sm font-semibold transition ${
        pathname.startsWith(href) ? 'text-blue-400' : 'text-slate-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-black text-white text-lg tracking-tight">
            Campus<span className="text-blue-400">Bridge</span>
          </Link>
          <div className="hidden md:flex items-center gap-5">
            {link('/dashboard', 'Dashboard')}
            {link('/discover', 'Discover')}
            {link('/communities', 'Communities')}
            {link('/certificates', 'Certificates')}
            {link('/activity-points', 'Points')}
            {link('/explore', 'Explore')}
            {isFaculty && link('/faculty', 'Faculty')}
            {isAdmin && link('/admin', 'Admin')}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-tight">{profile.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile.role || 'student'}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}