'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseclient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // LOGIC: If no user is logged in, OR we are on the home page, hide the navbar
  if (!user || pathname === '/') return null;

  return (
    <nav className="bg-white border-b p-4 shadow-sm mb-6 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex space-x-8 items-center">
          <span className="font-bold text-blue-600 text-xl">CampusBridge</span>
          <Link href="/explore" className={`font-medium transition-colors ${pathname === '/explore' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>Explore</Link>
          <Link href="/discover" className="text-gray-600 hover:text-blue-600 font-medium">Discover</Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">My Dashboard</Link>
        </div>
        <button onClick={handleSignOut} className="text-red-500 font-semibold text-sm">Sign Out</button>
      </div>
    </nav>
  )
}